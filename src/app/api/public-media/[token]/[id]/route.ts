/** Foto de uma prova pública: só se pertencer à prova do token (e a prova não estiver anulada). */
import { findPublicProofMedia, hitRateLimit } from "@/db/public";
import { requestMeta } from "@/lib/audit";
import { readMedia } from "@/server/media-store";

export async function GET(req: Request, { params }: { params: Promise<{ token: string; id: string }> }) {
  const { token, id } = await params;
  const meta = await requestMeta();
  if (await hitRateLimit(`pubmedia:${meta.ip ?? "-"}`, 300, 600)) return new Response(null, { status: 429 });
  if (!/^[0-9a-f-]{36}$/i.test(id) || !/^[A-Za-z0-9_-]{16,64}$/.test(token)) return new Response(null, { status: 404 });
  // a foto de um id nunca muda; o cache curto é para respeitar a anulação da prova.
  // Revalidação barata: confere o acesso e responde 304 sem ler os bytes.
  const etag = `"${id}"`;
  const headers = { "Cache-Control": "private, max-age=600", ETag: etag, "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex" };
  if (req.headers.get("if-none-match") === etag) {
    const ok = await findPublicProofMedia(token, id, false);
    if (!ok) return new Response(null, { status: 404 });
    return new Response(null, { status: 304, headers });
  }
  const m = await findPublicProofMedia(token, id);
  const bytes = m ? await readMedia(m) : null;
  if (!m || !bytes) return new Response(null, { status: 404 });
  return new Response(bytes, { headers: { ...headers, "Content-Type": m.mime } });
}
