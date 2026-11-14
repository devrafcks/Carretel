import { and, eq, isNull } from "drizzle-orm";
import { mediaAssets } from "@/db/schema";
import { workshopFromRequest } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await workshopFromRequest();
  if (!ctx) return new Response(null, { status: 401 });
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response(null, { status: 404 });
  const m = await ctx.tdb.first(mediaAssets, and(eq(mediaAssets.id, id), isNull(mediaAssets.deletedAt)));
  if (!m?.data) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(m.data), {
    headers: { "Content-Type": m.mime, "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" },
  });
}
