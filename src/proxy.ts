/**
 * Next.js 16: proxy.ts (substitui middleware.ts). Camada barata e OTIMISTA, antes de qualquer página ou API:
 * 1) bloqueia cabeçalho interno do Next vindo de fora (desvio de proxy);
 * 2) APIs: escrita só do próprio site (Origin/Referer; inclui login/cadastro) e APIs privadas só com cookie de sessão;
 * 3) páginas: next-intl (prefixo /es | /pt-BR) e, nas rotas do app, sessão obrigatória
 *    (só confere se há cookie de sessão; quem valida a sessão é o servidor) + sem cache e fora dos buscadores.
 * A autorização real (plano, dono, taller) é sempre no servidor: requireWorkshop / requireWrite / requireOwner.
 */
import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { MUTATING, classifyPath, hasForbiddenInternalHeader, hasSessionCookie, isSameOrigin, loginRedirectPath, requiresSameOrigin } from "./lib/route-guard";

const intl = createIntlMiddleware(routing);

const PRIVATE_HEADERS: [string, string][] = [
  ["Cache-Control", "private, no-store, max-age=0"],
  ["X-Robots-Tag", "noindex, nofollow"],
];

function deny(status: 401 | 403, error: string) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

function requestHost(request: NextRequest): string | null {
  return request.headers.get("x-forwarded-host") ?? request.headers.get("host");
}

export default async function proxy(request: NextRequest) {
  if (hasForbiddenInternalHeader(request.headers)) return deny(403, "forbidden");

  const { pathname } = request.nextUrl;
  const route = classifyPath(pathname);
  const sameOrigin = isSameOrigin(request.headers.get("origin"), request.headers.get("referer"), requestHost(request));

  /* ───── APIs ───── */
  if (route.kind === "private-api" || route.kind === "unknown-api" || route.kind === "self-auth-api") {
    if (route.kind === "unknown-api") return deny(403, "forbidden");
    if (requiresSameOrigin(pathname, request.method) && !sameOrigin) return deny(403, "cross_origin");
    if (route.kind === "self-auth-api") return NextResponse.next(); // webhook/cron validam a própria assinatura; auth limita tentativas na rota
    if (!hasSessionCookie(request.cookies.getAll().map((c) => c.name))) return deny(401, "unauthorized");
    const res = NextResponse.next();
    for (const [k, v] of PRIVATE_HEADERS) {
      // fotos do taller: a de um id nunca muda; a rota manda cache privado longo + ETag (não sobrescrever com no-store)
      if (k === "Cache-Control" && request.method === "GET" && pathname.startsWith("/api/media/")) continue;
      res.headers.set(k, v);
    }
    return res;
  }

  /* ───── Server Actions (POST em páginas) só do próprio site ───── */
  if (MUTATING.has(request.method) && request.headers.has("next-action") && !sameOrigin) return deny(403, "cross_origin");

  /* ───── Páginas ───── */
  const response = intl(request);
  if (response.headers.get("location")) return response; // redirect de idioma
  if (route.kind !== "app") return response;

  const loginUrl = new URL(loginRedirectPath(route.locale, route.segment, pathname), request.url);
  for (const [k, v] of PRIVATE_HEADERS) response.headers.set(k, v);

  if (!hasSessionCookie(request.cookies.getAll().map((c) => c.name))) return NextResponse.redirect(loginUrl);
  return response;
}

export const config = {
  // tudo menos arquivos estáticos e internos do Next (as APIs agora passam pelo proxy)
  matcher: "/((?!_next|_vercel|.*\\..*).*)",
};
