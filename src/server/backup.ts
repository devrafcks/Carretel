/**
 * Backup diário do banco no Vercel Blob (privado): backups/carretel-AAAA-MM-DD.json.gz.
 * Guarda as BACKUP_KEEP cópias mais novas e apaga as mais velhas.
 * Sem Blob (desenvolvimento): grava em .data/backups.
 */
import "server-only";
import { gzipSync } from "node:zlib";
import { del, get, list, put } from "@vercel/blob";
import { dumpDatabase } from "@/db/backup";
import { blobEnabled } from "./media-store";

export const BACKUP_PREFIX = "backups/";
export const BACKUP_KEEP = 14;

export type BackupInfo = { pathname: string; size: number; uploadedAt: string };

export async function runBackup(): Promise<{ pathname: string; bytes: number; tables: number; rows: number; removed: number }> {
  const dump = await dumpDatabase();
  const body = gzipSync(Buffer.from(JSON.stringify(dump)));
  const day = dump.createdAt.slice(0, 10);
  const name = `${BACKUP_PREFIX}carretel-${day}.json.gz`;
  const rows = Object.values(dump.tables).reduce((a, r) => a + r.length, 0);
  const tables = Object.keys(dump.tables).length;

  if (!blobEnabled()) {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const dir = path.join(process.cwd(), ".data", "backups");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `carretel-${day}.json.gz`), body);
    return { pathname: path.join(".data", "backups", `carretel-${day}.json.gz`), bytes: body.length, tables, rows, removed: 0 };
  }

  await put(name, body, { access: "private", contentType: "application/gzip", addRandomSuffix: false, allowOverwrite: true });
  const all = await listBackups();
  const old = all.slice(BACKUP_KEEP).map((b) => b.pathname);
  if (old.length) await del(old);
  return { pathname: name, bytes: body.length, tables, rows, removed: old.length };
}

/** Cópias guardadas, da mais nova para a mais velha. */
export async function listBackups(): Promise<BackupInfo[]> {
  if (!blobEnabled()) return [];
  const out: BackupInfo[] = [];
  let cursor: string | undefined;
  do {
    const r = await list({ prefix: BACKUP_PREFIX, cursor, limit: 100 });
    for (const b of r.blobs) out.push({ pathname: b.pathname, size: b.size, uploadedAt: new Date(b.uploadedAt).toISOString() });
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  return out.sort((a, b) => b.pathname.localeCompare(a.pathname));
}

/** Conteúdo (gzip) de uma cópia, para o admin baixar. */
export async function readBackup(pathname: string): Promise<ReadableStream<Uint8Array> | null> {
  if (!blobEnabled() || !/^backups\/carretel-\d{4}-\d{2}-\d{2}\.json\.gz$/.test(pathname)) return null;
  const r = await get(pathname, { access: "private" });
  if (!r || r.statusCode !== 200) return null;
  return r.stream;
}
