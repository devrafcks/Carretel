/**
 * Next.js 16: proxy.ts (substitui middleware.ts).
 * 1) next-intl: prefixo /es | /pt-BR, cookie NEXT_LOCALE, /c/abc → /{locale}/c/abc.
 * 2) Checagem OTIMISTA de sessão nas rotas do app (a autorização real é no servidor).
 *    Com Neon Auth, usa auth.middleware() (que também renova a sessão) e mescla os cookies.
 */
import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { createNeonAuth } from "@neon/auth/next/server";
import { routing } from "./i18n/routing";

const intl = createIntlMiddleware(routing);

const APP_SEGMENTS = new Set([
  "hoy",
  "lotes",
  "produccion",
  "cobros",
  "cuenta",
  "mas",
  "clientes",
  "equipo",
  "bienvenida",
  "go-live",
]);

const neonEnabled = Boolean(process.env.NEON_AUTH_BASE_URL && process.env.NEON_AUTH_COOKIE_SECRET);
const neonAuth = neonEnabled
  ? createNeonAuth({
      baseUrl: process.env.NEON_AUTH_BASE_URL!,
      cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET! },
    })
  : null;

function protectedLocale(pathname: string): string | null {
  const [, locale, segment] = pathname.split("/");
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) return null;
  return segment && APP_SEGMENTS.has(segment) ? locale : null;
}

export default async function proxy(request: NextRequest) {
  const response = intl(request);
  if (response.headers.get("location")) return response; // redirect de locale

  const locale = protectedLocale(request.nextUrl.pathname);
  if (!locale) return response;

  const loginUrl = new URL(`/${locale}/entrar`, request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);

  if (neonAuth) {
    const authMw = neonAuth.middleware({ loginUrl: `/${locale}/entrar` });
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
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
