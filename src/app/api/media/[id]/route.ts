import { and, eq, isNull } from "drizzle-orm";
import { mediaAssets } from "@/db/schema";
import { workshopFromRequest } from "@/lib/session";
import type { Scope } from "@/db/tenant";

/**
 * Foto do taller. A foto de um id nunca muda: cache longo no navegador e, se ele já tiver a foto
 * (If-None-Match), responde 304 sem ler os bytes do banco.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await workshopFromRequest();
  if (!ctx) return new Response(null, { status: 401 });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response(null, { status: 404 });
  const where = (scope: Scope) => and(scope(mediaAssets), eq(mediaAssets.id, id), isNull(mediaAssets.deletedAt));
  const etag = `"${id}"`;
  const headers = { "Cache-Control": "private, max-age=31536000, immutable", ETag: etag, "X-Content-Type-Options": "nosniff" };

  if (req.headers.get("if-none-match") === etag) {
    const found = await ctx.tdb.query((db, scope) => db.select({ id: mediaAssets.id }).from(mediaAssets).where(where(scope)).limit(1));
    if (found[0]) return new Response(null, { status: 304, headers });
  }
  const rows = await ctx.tdb.query((db, scope) => db.select({ data: mediaAssets.data, mime: mediaAssets.mime }).from(mediaAssets).where(where(scope)).limit(1));
  const m = rows[0];
  if (!m?.data) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(m.data), { headers: { ...headers, "Content-Type": m.mime } });
}
