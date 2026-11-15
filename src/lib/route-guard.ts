/**
 * Regras do proxy (funções puras, testadas em tests/unit/route-guard.test.ts).
 * O proxy faz só checagens OTIMISTAS e baratas (sem banco). A autorização de verdade
 * continua no servidor: requireWorkshop + requireWrite/requireOwner + tenantDb em toda ação e rota.
 */

export const LOCALES = ["es", "pt-BR"] as const;

/** Páginas que só existem para quem está logado. */
export const APP_SEGMENTS = new Set([
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
  "calculadora",
  "notificaciones",
  "relatorios",
  "admin",
]);

/** Páginas em que quem não tem conta deve cair direto em "Criar conta". */
export const SIGNUP_FIRST = new Set(["calculadora"]);

/** APIs do taller logado: sem cookie de sessão nem chegam ao handler. */
const PRIVATE_API = ["/api/sync", "/api/upload", "/api/media", "/api/export", "/api/notifications", "/api/reports"];

/** APIs que se autenticam sozinhas (Neon Auth, webhook assinado, cron com segredo, link público por token). */
const SELF_AUTH_API = ["/api/auth", "/api/webhooks", "/api/cron", "/api/public-media", "/api/dev-auth"];

/** Dessas, as que só o nosso próprio formulário chama: escrita exige mesma origem (login CSRF / uso de fora). */
const FIRST_PARTY_SELF_AUTH = ["/api/auth", "/api/dev-auth"];

export type RouteKind =
  | { kind: "app"; locale: string; segment: string }
  | { kind: "private-api" }
  | { kind: "self-auth-api" }
  | { kind: "unknown-api" }
  | { kind: "public" };

const startsWithSegment = (path: string, prefix: string) => path === prefix || path.startsWith(prefix + "/");

export function classifyPath(pathname: string): RouteKind {
  if (startsWithSegment(pathname, "/api")) {
    if (PRIVATE_API.some((p) => startsWithSegment(pathname, p))) return { kind: "private-api" };
    if (SELF_AUTH_API.some((p) => startsWithSegment(pathname, p))) return { kind: "self-auth-api" };
    return { kind: "unknown-api" };
  }
  const [, locale, segment] = pathname.split("/");
  if (locale && (LOCALES as readonly string[]).includes(locale) && segment && APP_SEGMENTS.has(segment)) {
    return { kind: "app", locale, segment };
  }
  return { kind: "public" };
}

/** Há cookie de sessão (Neon Auth ou login de desenvolvimento)? Não valida — só evita trabalho à toa. */
export function hasSessionCookie(cookieNames: Iterable<string>): boolean {
  for (const n of cookieNames) {
    if (n === "carretel_dev_session" || n.endsWith("neon-auth.session_token")) return true;
  }
  return false;
}

export const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** Escrita nesta rota precisa vir do próprio site? (APIs privadas, login/cadastro; webhooks e cron não). */
export function requiresSameOrigin(pathname: string, method: string): boolean {
  if (!MUTATING.has(method)) return false;
  const route = classifyPath(pathname);
  if (route.kind === "private-api") return true;
  return route.kind === "self-auth-api" && FIRST_PARTY_SELF_AUTH.some((p) => startsWithSegment(pathname, p));
}

/**
 * Pedido de escrita veio do próprio site? Confere Origin (ou Referer, se faltar) contra o host.
 * Navegadores sempre mandam Origin em POST de outro site, então ausência dos dois = cliente não-navegador → bloqueia.
 */
export function isSameOrigin(origin: string | null, referer: string | null, host: string | null): boolean {
  if (!host) return false;
  const source = origin && origin !== "null" ? origin : referer;
  if (!source) return false;
  try {
    return new URL(source).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

/** Cabeçalho interno do Next que nunca deve vir de fora (bloqueia desvio do proxy, ex.: CVE-2025-29927). */
export function hasForbiddenInternalHeader(headers: Headers): boolean {
  return headers.has("x-middleware-subrequest");
}

/** Para onde mandar quem não tem sessão. `next` só aceita caminho interno do próprio app. */
export function loginRedirectPath(locale: string, segment: string, pathname: string): string {
  const params = new URLSearchParams();
  if (SIGNUP_FIRST.has(segment)) params.set("conta", "nova");
  // mesmo formato que /entrar aceita como destino depois do login
  if (/^\/(es|pt-BR)\/[a-z/-]*$/.test(pathname)) params.set("next", pathname);
  return `/${locale}/entrar?${params.toString()}`;
}
