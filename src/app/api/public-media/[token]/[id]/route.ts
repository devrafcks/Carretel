/** Foto de uma prova pública: só se pertencer à prova do token (e a prova não estiver anulada). */
import { findPublicProofMedia, hitRateLimit } from "@/db/public";
import { requestMeta } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string; id: string }> }) {
  const { token, id } = await params;
  const meta = await requestMeta();
  if (await hitRateLimit(`pubmedia:${meta.ip ?? "-"}`, 300, 600)) return new Response(null, { status: 429 });
  if (!/^[0-9a-f-]{36}$/i.test(id) || !/^[A-Za-z0-9_-]{16,64}$/.test(token)) return new Response(null, { status: 404 });
  const m = await findPublicProofMedia(token, id);
  if (!m?.data) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(m.data), {
    headers: {
      "Content-Type": m.mime,
      "Cache-Control": "private, max-age=600",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex",
    },
  });
}
