"use client";
/**
 * Fila offline (IndexedDB via idb). Cada mutação: client_mutation_id (UUID v7) + workshopId + payload.
 * Fotos ficam como Blob até sincronizar (sobem antes da mutação que as usa).
 * Sync: evento `online`, intervalo com backoff e botão manual; lotes de até 50 em POST /api/sync.
 */
import { openDB, type IDBPDatabase } from "idb";
import { uuidv7 } from "uuidv7";
import type { MutationType } from "@/lib/schemas";

export interface QueuedMutation {
  clientMutationId: string;
  workshopId: string;
  type: MutationType;
  payload: Record<string, unknown>;
  /** fotos pendentes: chave do payload onde entram os ids depois do upload */
  photos?: { blob: Blob; width: number; height: number }[];
  photoField?: string;
  clientCreatedAt: string;
  attempts: number;
  lastError?: string;
}

const DB_NAME = "carretel-offline";
const STORE = "mutations";

let dbPromise: Promise<IDBPDatabase> | null = null;
function db() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(d) {
        if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: "clientMutationId" });
      },
    });
  }
  return dbPromise;
}

export function newMutationId(): string {
  return uuidv7();
}

export async function enqueue(m: Omit<QueuedMutation, "attempts" | "clientCreatedAt" | "clientMutationId"> & { clientMutationId?: string }) {
  const full: QueuedMutation = {
    ...m,
    clientMutationId: m.clientMutationId ?? uuidv7(),
    clientCreatedAt: new Date().toISOString(),
    attempts: 0,
  };
  await (await db()).put(STORE, full);
  notify();
  return full.clientMutationId;
}

export async function pending(workshopId?: string): Promise<QueuedMutation[]> {
  const all = (await (await db()).getAll(STORE)) as QueuedMutation[];
  return all.filter((m) => !workshopId || m.workshopId === workshopId).sort((a, b) => a.clientCreatedAt.localeCompare(b.clientCreatedAt));
}

export async function remove(id: string) {
  await (await db()).delete(STORE, id);
  notify();
}

async function update(m: QueuedMutation) {
  await (await db()).put(STORE, m);
}

const listeners = new Set<() => void>();
export function onQueueChange(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function notify() {
  for (const fn of listeners) fn();
}

export async function uploadPhoto(blob: Blob, width: number, height: number, onProgress?: (p: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", blob, "foto.webp");
    form.append("width", String(width));
    form.append("height", String(height));
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText).id as string);
      else reject(new Error(`upload_${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(form);
  });
}

export type SyncResult = { clientMutationId: string; status: "applied" | "duplicate" | "rejected"; serverId?: string; error?: string };

let syncing: Promise<{ sent: number; rejected: SyncResult[] }> | null = null;

/** Envia a fila (lotes de 50). Mutações rejeitadas por regra saem da fila e são reportadas. */
export function syncNow(workshopId: string): Promise<{ sent: number; rejected: SyncResult[] }> {
  if (syncing) return syncing;
  syncing = (async () => {
    let sent = 0;
    const rejected: SyncResult[] = [];
    const items = await pending(workshopId);
    for (let i = 0; i < items.length; i += 50) {
      const chunk = items.slice(i, i + 50);
      // fotos primeiro
      for (const m of chunk) {
        if (m.photos?.length && m.photoField) {
          const ids: string[] = Array.isArray(m.payload[m.photoField]) ? [...(m.payload[m.photoField] as string[])] : [];
          for (const p of m.photos) ids.push(await uploadPhoto(p.blob, p.width, p.height));
          m.payload = { ...m.payload, [m.photoField]: ids };
          m.photos = [];
          await update(m);
        }
      }
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mutations: chunk.map((m) => ({ clientMutationId: m.clientMutationId, type: m.type, payload: m.payload, clientCreatedAt: m.clientCreatedAt })),
        }),
      });
      if (!res.ok) throw new Error(`sync_${res.status}`);
      const { results } = (await res.json()) as { results: SyncResult[] };
      for (const r of results) {
        if (r.status === "rejected" && r.error === "server_error") {
          const m = chunk.find((c) => c.clientMutationId === r.clientMutationId);
          if (m) await update({ ...m, attempts: m.attempts + 1, lastError: r.error });
          continue;
        }
        if (r.status === "rejected") rejected.push(r);
        await remove(r.clientMutationId);
        sent++;
      }
    }
    return { sent, rejected };
  })().finally(() => {
    syncing = null;
  });
  return syncing;
}

/**
 * Executa uma mutação: online → manda já (mesma rota idempotente); offline ou falha de rede → fila.
 */
export async function submitMutation(
  workshopId: string,
  type: MutationType,
  payload: Record<string, unknown>,
  opts: { photos?: QueuedMutation["photos"]; photoField?: string } = {},
): Promise<{ queued: boolean; result?: SyncResult }> {
  const clientMutationId = uuidv7();
  const online = typeof navigator === "undefined" ? true : navigator.onLine;
  if (online) {
    try {
      let finalPayload = payload;
      if (opts.photos?.length && opts.photoField) {
        const ids: string[] = [];
        for (const p of opts.photos) ids.push(await uploadPhoto(p.blob, p.width, p.height));
        finalPayload = { ...payload, [opts.photoField]: ids };
      }
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mutations: [{ clientMutationId, type, payload: finalPayload, clientCreatedAt: new Date().toISOString() }] }),
      });
      if (res.status === 401) throw Object.assign(new Error("unauthorized"), { fatal: true });
      if (!res.ok) throw new Error(`sync_${res.status}`);
      const { results } = (await res.json()) as { results: SyncResult[] };
      const r = results[0]!;
      if (r.status === "rejected" && r.error === "server_error") throw new Error("server_error");
      return { queued: false, result: r };
    } catch (err) {
      if ((err as { fatal?: boolean }).fatal) throw err;
      // cai para a fila (rede caiu no meio)
    }
  }
  await enqueue({ clientMutationId, workshopId, type, payload, photos: opts.photos, photoField: opts.photoField });
  return { queued: true };
}
