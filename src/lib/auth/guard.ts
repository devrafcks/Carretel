/**
 * Checagens do proxy do Neon Auth antes de repassar um POST (usadas em src/app/api/auth/[...path]/route.ts):
 * 1) limite de tentativas por IP (e por e-mail no login e na senha) numa tabela do Postgres → 429 + Retry-After;
 * 2) senha nova (cadastro, redefinição, troca) precisa passar pela mesma regra de força do formulário (zxcvbn).
 */
import "server-only";
import { z } from "zod";
import { consumeRateLimit } from "@/db/public";
import { PASSWORD_FIELDS, authRulesFor, clientIp, ipBucket, rateKey, type RateRule } from "@/lib/rate-limit";
import { checkPassword, PASSWORD_MAX_LENGTH, type StrengthLocale } from "@/lib/password-strength";
import { reportError } from "@/server/log";

const NO_STORE = { "Cache-Control": "no-store" };

/** Campos do corpo que importam aqui; o resto segue intacto para o Neon Auth. */
const authBody = z
  .object({
    email: z.string().max(320).optional(),
    name: z.string().max(200).optional(),
    password: z.string().max(PASSWORD_MAX_LENGTH * 4).optional(),
    newPassword: z.string().max(PASSWORD_MAX_LENGTH * 4).optional(),
  })
  .loose();
type AuthBody = z.infer<typeof authBody>;

async function readBody(req: Request): Promise<AuthBody | null> {
  if (!(req.headers.get("content-type") ?? "").includes("application/json")) return null;
  try {
    const parsed = authBody.safeParse(await req.clone().json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Idioma da tela que fez o pedido (o mesmo dicionário que o medidor usou). */
function requestLocale(req: Request): StrengthLocale {
  const ref = req.headers.get("referer") ?? "";
  try {
    if (new URL(ref).pathname.startsWith("/pt-BR")) return "pt-BR";
  } catch {
    /* sem referer */
  }
  return /(?:^|;\s*)NEXT_LOCALE=pt-BR/.test(req.headers.get("cookie") ?? "") ? "pt-BR" : "es";
}

async function overLimit(rule: RateRule, subject: string): Promise<number | null> {
  try {
    const d = await consumeRateLimit(rateKey(rule.name, subject), rule.limit, rule.windowSeconds);
    return d.allowed ? null : d.retryAfterSeconds;
  } catch (err) {
    // banco fora do ar não pode trancar o login de todo mundo: segue (o Neon Auth tem limite próprio)
    reportError("rate_limit_failed", err, { source: "auth", level: "warn", lookupRequest: false, context: { rule: rule.name } });
    return null;
  }
}

function tooMany(retryAfter: number) {
  return Response.json(
    { code: "RATE_LIMITED", message: "Too many attempts. Try again later.", retryAfter },
    { status: 429, headers: { ...NO_STORE, "Retry-After": String(retryAfter) } },
  );
}

/** Checagens antes de repassar. Devolve a resposta de bloqueio ou null para seguir. */
export async function guardAuthPost(req: Request, path: string): Promise<Response | null> {
  const body = await readBody(req);
  const rules = authRulesFor(path);
  const ip = ipBucket(clientIp(req.headers));

  const ipWait = await overLimit(rules.ip, ip);
  if (ipWait !== null) return tooMany(ipWait);

  const email = body?.email?.trim().toLowerCase();
  if (rules.email && email) {
    const emailWait = await overLimit(rules.email, email);
    if (emailWait !== null) return tooMany(emailWait);
  }

  const field = PASSWORD_FIELDS[path];
  if (field) {
    const password = body?.[field];
    if (typeof password !== "string") {
      return Response.json({ code: "INVALID_REQUEST", message: "Invalid request body." }, { status: 400, headers: NO_STORE });
    }
    const strength = await checkPassword(password, { locales: [requestLocale(req)], email, name: body?.name });
    if (!strength.ok) {
      const code = strength.hint === "tooShort" ? "PASSWORD_TOO_SHORT" : strength.hint === "tooLong" ? "PASSWORD_TOO_LONG" : "PASSWORD_TOO_WEAK";
      return Response.json({ code, message: "Password is too weak.", hint: strength.hint, score: strength.score }, { status: 400, headers: NO_STORE });
    }
  }
  return null;
}
