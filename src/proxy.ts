/**
 * Next.js 16: proxy.ts (substitui middleware.ts). Camada barata e OTIMISTA, antes de qualquer página ou API:
 * 1) bloqueia cabeçalho interno do Next vindo de fora (desvio de proxy);
 * 2) APIs: escrita só do próprio site (Origin/Referer) e APIs privadas só com cookie de sessão;
 * 3) páginas: next-intl (prefixo /es | /pt-BR) e, nas rotas do app, sessão obrigatória
 *    (com Neon Auth: auth.middleware(), que também renova a sessão) + sem cache e fora dos buscadores.
 * A autorização real (plano, dono, taller) é sempre no servidor: requireWorkshop / requireWrite / requireOwner.
 */
import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { createNeonAuth } from "@neon/auth/next/server";
import { routing } from "./i18n/routing";
import { MUTATING, classifyPath, hasForbiddenInternalHeader, hasSessionCookie, isSameOrigin, loginRedirectPath } from "./lib/route-guard";

const intl = createIntlMiddleware(routing);

const neonEnabled = Boolean(process.env.NEON_AUTH_BASE_URL && process.env.NEON_AUTH_COOKIE_SECRET);
const neonAuth = neonEnabled
  ? createNeonAuth({
      baseUrl: process.env.NEON_AUTH_BASE_URL!,
      cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET! },
    })
  : null;

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
    if (route.kind === "self-auth-api") return NextResponse.next(); // webhook/cron/auth validam a própria assinatura
    if (MUTATING.has(request.method) && !sameOrigin) return deny(403, "cross_origin");
    if (!hasSessionCookie(request.cookies.getAll().map((c) => c.name))) return deny(401, "unauthorized");
    const res = NextResponse.next();
    for (const [k, v] of PRIVATE_HEADERS) res.headers.set(k, v);
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

  if (neonAuth) {
    const authMw = neonAuth.middleware({ loginUrl: `/${route.locale}/entrar` });
    const authRes = await authMw(request);
    if (authRes.headers.get("location")) {
      const redirect = NextResponse.redirect(loginUrl);
      for (const c of authRes.headers.getSetCookie()) redirect.headers.append("Set-Cookie", c);
      return redirect;
    }
    for (const c of authRes.headers.getSetCookie()) response.headers.append("Set-Cookie", c);
    // repassa cabeçalhos de request que o auth injeta (sessão renovada)
    const override = authRes.headers.get("x-middleware-override-headers");
    if (override) {
      const existing = response.headers.get("x-middleware-override-headers");
      const merged = new Set([...(existing ? existing.split(",") : []), ...override.split(",")]);
      response.headers.set("x-middleware-override-headers", [...merged].join(","));
      for (const [k, v] of authRes.headers) {
        if (k.startsWith("x-middleware-request-")) response.headers.set(k, v);
      }
    }
    return response;
  }

  if (!request.cookies.get("carretel_dev_session")) return NextResponse.redirect(loginUrl);
  return response;
}

export const config = {
  // tudo menos arquivos estáticos e internos do Next (as APIs agora passam pelo proxy)
  matcher: "/((?!_next|_vercel|.*\\..*).*)",
};
