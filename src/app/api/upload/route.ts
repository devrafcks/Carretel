/**
 * Upload de foto (já comprimida em WebP no cliente, sem EXIF/GPS — o canvas não copia metadados).
 * Armazena no Postgres (bytea) enquanto o Vercel Blob não estiver configurado.
 * Verificação extra: recusa JPEG com segmento APP1 (EXIF) e PNG com chunk eXIf.
 */
import { randomBytes } from "node:crypto";
import { mediaAssets } from "@/db/schema";
import { workshopFromRequest } from "@/lib/session";
import { hitRateLimit } from "@/db/public";

const MAX_BYTES = 2.5 * 1024 * 1024;
const ALLOWED = new Set(["image/webp", "image/jpeg", "image/png"]);

function hasExif(buf: Buffer, mime: string): boolean {
  if (mime === "image/jpeg") {
    for (let i = 2; i < Math.min(buf.length - 4, 65536); i++) {
      if (buf[i] === 0xff && buf[i + 1] === 0xe1) return true;
    }
  }
  if (mime === "image/png") return buf.includes(Buffer.from("eXIf"));
  if (mime === "image/webp") return buf.subarray(0, 64).includes(Buffer.from("EXIF"));
  return false;
}

export async function POST(req: Request) {
  const ctx = await workshopFromRequest();
  if (!ctx) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!ctx.access.canWrite) return Response.json({ error: "read_only" }, { status: 403 });
  if (await hitRateLimit(`upload:${ctx.workshop.id}`, 60, 600)) return Response.json({ error: "rate_limited" }, { status: 429 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof Blob)) return Response.json({ error: "no_file" }, { status: 400 });
  if (!ALLOWED.has(file.type)) return Response.json({ error: "type" }, { status: 415 });
  if (file.size > MAX_BYTES) return Response.json({ error: "too_large" }, { status: 413 });
  const buf = Buffer.from(await file.arrayBuffer());
  if (hasExif(buf, file.type)) return Response.json({ error: "exif_present" }, { status: 422 });

  const width = Number(form?.get("width") ?? 0) || null;
  const height = Number(form?.get("height") ?? 0) || null;
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
