/**
 * Limite de tentativas: regras puras (testadas em tests/unit/rate-limit.test.ts).
 * O contador fica numa tabela do próprio Postgres (rate_limits, Neon): funciona entre instâncias
 * serverless da Vercel sem serviço novo pago. Algoritmo: janela deslizante aproximada
 * (contagem da janela atual + parte proporcional da anterior), a mesma ideia do Upstash/Cloudflare.
 */
import { createHash } from "node:crypto";

export type RateRule = { name: string; limit: number; windowSeconds: number };
export type RateDecision = { allowed: boolean; retryAfterSeconds: number };

/**
 * Decide com a contagem já incluindo o pedido atual.
 * estimativa = anterior × (1 − fração já decorrida da janela atual) + atual
 */
export function slidingWindowDecision(input: { prevCount: number; count: number; elapsedMs: number; windowMs: number; limit: number }): RateDecision {
  const { prevCount, count, windowMs, limit } = input;
  const elapsed = Math.min(Math.max(input.elapsedMs, 0), windowMs);
  const weight = 1 - elapsed / windowMs;
  const estimate = prevCount * weight + count;
  if (estimate <= limit) return { allowed: true, retryAfterSeconds: 0 };

  // Quanto esperar até um PRÓXIMO pedido caber:
  // 1) ainda nesta janela, se o peso da anterior cair o bastante: prev × (1 − t/W) + count + 1 ≤ limit
  let waitMs = Infinity;
  if (count + 1 <= limit && prevCount > 0) {
    const t = windowMs * (1 - (limit - count - 1) / prevCount);
    if (t <= windowMs) waitMs = t - elapsed;
  }
  // 2) senão, depois que esta janela virar "anterior": count × (1 − s/W) + 1 ≤ limit
  if (!Number.isFinite(waitMs)) {
    const s = count <= limit - 1 ? 0 : windowMs * (1 - (limit - 1) / count);
    waitMs = windowMs - elapsed + s;
  }
  return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(waitMs / 1000)) };
}

/** Início da janela fixa que contém `nowMs`. */
export function windowStartFor(nowMs: number, windowSeconds: number): number {
  const w = windowSeconds * 1000;
  return Math.floor(nowMs / w) * w;
}

/** IP do cliente. Na Vercel, x-real-ip e o 1º item do x-forwarded-for vêm da borda (não do cliente). */
export function clientIp(headers: Headers): string | null {
  const real = headers.get("x-real-ip")?.trim();
  const fwd = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  for (const candidate of [real, fwd]) {
    const ip = candidate ? normalizeIpAddress(candidate) : null;
    if (ip) return ip;
  }
  return null;
}

function normalizeIpAddress(raw: string): string | null {
  const v = raw.replace(/^\[|\]$/g, "").replace(/^::ffff:/i, "");
  if (/^(\d{1,3})(\.\d{1,3}){3}$/.test(v) && v.split(".").every((o) => Number(o) <= 255)) return v;
  if (/^[0-9a-f:]+$/i.test(v) && v.includes(":")) return v.toLowerCase();
  return null;
}

/**
 * Chave de limite por IP. IPv6: agrupa por /64 (um único cliente costuma ter um /64 inteiro e
 * trocaria de endereço a cada tentativa).
 */
export function ipBucket(ip: string | null): string {
  if (!ip) return "unknown";
  if (!ip.includes(":")) return ip;
  const [head = "", tail = ""] = ip.split("::");
  const h = head ? head.split(":") : [];
  const t = tail ? tail.split(":") : [];
  const groups = ip.includes("::") ? [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill("0"), ...t] : h;
  return groups.slice(0, 4).map((g) => (g || "0").replace(/^0+(?=.)/, "")).join(":") + "::/64";
}

/** Não guarda IP nem e-mail em claro na tabela (LGPD): só um hash curto. */
export function rateKey(rule: string, subject: string): string {
  return `${rule}:${createHash("sha256").update("carretel-rl:" + subject).digest("base64url").slice(0, 22)}`;
}

/* ───── Regras das rotas de autenticação (/api/auth/*, Neon Auth) ───── */
const MIN = 60;

export const AUTH_RULES = {
  signInIp: { name: "signin-ip", limit: 20, windowSeconds: 15 * MIN },
  /** freia força bruta numa conta mesmo vinda de vários IPs */
  signInEmail: { name: "signin-email", limit: 8, windowSeconds: 15 * MIN },
  signUpIp: { name: "signup-ip", limit: 5, windowSeconds: 60 * MIN },
  resetRequestIp: { name: "reset-req-ip", limit: 5, windowSeconds: 15 * MIN },
  /** evita encher a caixa de alguém de códigos */
  resetRequestEmail: { name: "reset-req-email", limit: 3, windowSeconds: 15 * MIN },
  resetIp: { name: "reset-ip", limit: 10, windowSeconds: 15 * MIN },
  /** código de 6 dígitos: poucas tentativas por e-mail */
  resetEmail: { name: "reset-email", limit: 5, windowSeconds: 15 * MIN },
  /** qualquer outro POST de /api/auth (OTP, troca de senha/e-mail, sair...) */
  otherIp: { name: "auth-ip", limit: 60, windowSeconds: 10 * MIN },
} as const satisfies Record<string, RateRule>;

/** Caminho dentro de /api/auth → quais regras valem e se o corpo tem e-mail para a regra por conta. */
export function authRulesFor(path: string): { ip: RateRule; email?: RateRule } {
  switch (path) {
    case "sign-in/email":
      return { ip: AUTH_RULES.signInIp, email: AUTH_RULES.signInEmail };
    case "sign-up/email":
      return { ip: AUTH_RULES.signUpIp };
    case "email-otp/request-password-reset":
    case "forget-password/email-otp":
    case "request-password-reset":
    case "forget-password":
      return { ip: AUTH_RULES.resetRequestIp, email: AUTH_RULES.resetRequestEmail };
    case "email-otp/reset-password":
    case "reset-password":
      return { ip: AUTH_RULES.resetIp, email: AUTH_RULES.resetEmail };
    default:
      return { ip: AUTH_RULES.otherIp };
  }
}

/** Caminhos onde a senha nova precisa passar pela regra de força (e o campo onde ela vem). */
export const PASSWORD_FIELDS: Record<string, "password" | "newPassword"> = {
  "sign-up/email": "password",
  "email-otp/reset-password": "password",
  "reset-password": "newPassword",
  "change-password": "newPassword",
};
