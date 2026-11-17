/**
 * Onde as fotos ficam guardadas.
 * - Com BLOB_READ_WRITE_TOKEN (Vercel Blob ligado na Vercel): blob PRIVADO — ninguém abre pelo link,
 *   a foto só sai pelas nossas rotas (/api/media, link público da prova), que conferem o acesso.
 * - Sem token, ou se o Blob falhar no envio: bytes no Postgres (como antes). As duas formas convivem.
 */
import "server-only";
import { del, get, put } from "@vercel/blob";
import { reportError } from "@/server/log";

export function blobEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

const EXT: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };

/** Envia para o Blob; devolve o pathname guardado em storage_key, ou null se não deu (cai para o banco). */
export async function putBlob(workshopId: string, key: string, buf: Buffer, mime: string): Promise<string | null> {
  if (!blobEnabled()) return null;
  try {
    const r = await put(`media/${workshopId}/${key}.${EXT[mime] ?? "bin"}`, buf, { access: "private", contentType: mime, addRandomSuffix: false });
    return r.pathname;
  } catch (err) {
    reportError("blob_put_failed", err, { source: "storage" });
    return null;
  }
}

/** Bytes da foto, venha do Blob ou do banco. */
export async function readMedia(m: { storage: string; storageKey: string; data: Buffer | null }): Promise<Uint8Array<ArrayBuffer> | null> {
  if (m.storage !== "vercel-blob") return m.data ? new Uint8Array(m.data) : null;
  try {
    const r = await get(m.storageKey, { access: "private" });
    if (!r || r.statusCode !== 200) return null;
    return new Uint8Array(await new Response(r.stream).arrayBuffer());
  } catch (err) {
    reportError("blob_get_failed", err, { source: "storage", level: "warn" });
    return null;
  }
}

/** Apaga do Blob (exclusão de conta). Falha não impede a exclusão do resto. */
export async function deleteBlobs(pathnames: string[]): Promise<void> {
  if (!pathnames.length || !blobEnabled()) return;
  for (let i = 0; i < pathnames.length; i += 100) {
    try {
      await del(pathnames.slice(i, i + 100));
    } catch (err) {
      reportError("blob_delete_failed", err, { source: "storage", level: "warn", lookupRequest: false });
    }
  }
}
