/**
 * Upload de foto (já comprimida em WebP no cliente, sem EXIF/GPS — o canvas não copia metadados).
 * Armazena no Postgres (bytea) enquanto o Vercel Blob não estiver configurado.
 * Verificação extra: recusa JPEG com segmento APP1 (EXIF) e PNG com chunk eXIf.
 */
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { mediaAssets } from "@/db/schema";
import { workshopFromRequest } from "@/lib/session";
import { hitRateLimit } from "@/db/public";
import { jpegHasExif } from "@/lib/image-check";

const MAX_BYTES = 2.5 * 1024 * 1024;
const ALLOWED = new Set(["image/webp", "image/jpeg", "image/png"]);

function hasExif(buf: Buffer, mime: string): boolean {
  if (mime === "image/jpeg") return jpegHasExif(buf);
  if (mime === "image/png") return buf.includes(Buffer.from("eXIf"));
  if (mime === "image/webp") return buf.subarray(0, 64).includes(Buffer.from("EXIF"));
  return false;
}

/** Recusa com o motivo no log (a foto some do registro no app; aqui fica o porquê para investigar). */
function reject(error: string, status: number, info: Record<string, unknown> = {}) {
  console.warn(JSON.stringify({ level: "warn", msg: "upload_rejected", error, status, ...info }));
  return Response.json({ error }, { status });
}

export async function POST(req: Request) {
  const ctx = await workshopFromRequest();
  if (!ctx) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!ctx.access.canWrite) return Response.json({ error: "read_only" }, { status: 403 });
  if (await hitRateLimit(`upload:${ctx.workshop.id}`, 60, 600)) return Response.json({ error: "rate_limited" }, { status: 429 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof Blob)) return reject("no_file", 400);
  if (!ALLOWED.has(file.type)) return reject("type", 415, { type: file.type, size: file.size });
  if (file.size > MAX_BYTES) return reject("too_large", 413, { type: file.type, size: file.size });
  const buf = Buffer.from(await file.arrayBuffer());
  if (hasExif(buf, file.type)) return reject("exif_present", 422, { type: file.type, size: file.size });

  // dimensões informadas pelo navegador: inteiros plausíveis ou nada
  const dim = z.coerce.number().int().min(1).max(20_000).nullable().catch(null);
  const width = dim.parse(form?.get("width") ?? null);
  const height = dim.parse(form?.get("height") ?? null);
  const row = await ctx.tdb.insert(mediaAssets, {
    storage: "db",
    storageKey: randomBytes(16).toString("hex"),
    data: buf,
    mime: file.type,
    bytes: buf.length,
    width,
    height,
    exifStripped: true,
  });
  return Response.json({ id: row.id });
}
