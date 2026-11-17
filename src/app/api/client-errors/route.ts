/**
 * Erros que acontecem no navegador (tela quebrou, promessa rejeitada sem tratamento) chegam aqui e vão para /admin/erros.
 * Aberto também para quem não está logado (a tela de entrar também pode quebrar), por isso:
 * limite por IP, corpo pequeno e validado, mesma origem e nada de cookie de terceiros.
 */
import { z } from "zod";
import { consumeRateLimit } from "@/db/public";
import { clientIp, ipBucket, rateKey } from "@/lib/rate-limit";
import { logError } from "@/server/log";

const MAX_BODY = 16_000;

const bodySchema = z.object({
  ref: z.string().regex(/^[A-Za-z0-9-]{4,64}$/),
  kind: z.enum(["boundary", "error", "rejection"]),
  name: z.string().max(120).optional(),
  message: z.string().max(2000),
  stack: z.string().max(8000).optional(),
  digest: z.string().max(64).optional(),
  path: z.string().max(500),
  online: z.boolean().optional(),
  build: z.string().max(64).optional(),
});

export async function POST(req: Request) {
  // só a própria página manda (sendBeacon e fetch same-origin mandam Origin)
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return new Response(null, { status: 403 });
  const raw = await req.text().catch(() => "");
  if (!raw || raw.length > MAX_BODY) return new Response(null, { status: 413 });

  const ip = clientIp(req.headers);
  try {
    const d = await consumeRateLimit(rateKey("client-error", ipBucket(ip)), 30, 600);
    if (!d.allowed) return new Response(null, { status: 429, headers: { "Retry-After": String(d.retryAfterSeconds) } });
  } catch {
    /* banco fora: o logError abaixo também vai falhar e cair no log da Vercel */
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(JSON.parse(raw));
  } catch {
    return new Response(null, { status: 400 });
  }
  const err = Object.assign(new Error(parsed.message), { name: parsed.name || "Error", stack: parsed.stack ?? undefined });
  await logError(parsed.kind === "boundary" ? "client_screen_error" : parsed.kind === "rejection" ? "client_unhandled_rejection" : "client_error", err, {
    source: parsed.kind === "boundary" ? "boundary" : "client",
    ref: parsed.ref,
    digest: parsed.digest ?? null,
    path: parsed.path.split("?")[0],
    method: "BROWSER",
    userAgent: req.headers.get("user-agent"),
    context: { online: parsed.online ?? null, build: parsed.build ?? null },
  });
  return new Response(null, { status: 204 });
}
