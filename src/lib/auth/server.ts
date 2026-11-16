/**
 * Autenticação.
 * - Produção: Better Auth próprio (src/lib/auth/better.ts) com e-mail + senha, sem confirmação de e-mail;
 *   usuários e sessões no schema app_auth. O modo continua se chamando "neon" (= login de verdade) para não
 *   mexer em todos os componentes que recebem esse valor.
 * - Dev sem BETTER_AUTH_SECRET: modo local com código de 6 dígitos mostrado na tela e no console.
 */
import "server-only";
import { cookies, headers } from "next/headers";
import { createHash, createHmac } from "node:crypto";
import { auth } from "./better";

export type SessionUser = { id: string; email: string; name: string | null };
export type AuthMode = "neon" | "dev";

export function authMode(): AuthMode {
  return process.env.BETTER_AUTH_SECRET ? "neon" : "dev";
}

export function devAuthAllowed(): boolean {
  return authMode() === "dev" && (process.env.NODE_ENV !== "production" || process.env.ALLOW_DEV_AUTH === "1");
}

/* ───── modo dev ───── */
export const DEV_COOKIE = "carretel_dev_session";
const DEV_SESSION_DAYS = 60;

function devSecret(): string {
  return process.env.DEV_AUTH_SECRET || "carretel-dev-auth-secret-not-for-production";
}

export function hashCode(email: string, code: string): string {
  return createHash("sha256").update(email.toLowerCase() + ":" + code + ":" + devSecret()).digest("hex");
}

export function signDevSession(user: SessionUser): { value: string; maxAge: number } {
  const exp = Date.now() + DEV_SESSION_DAYS * 86_400_000;
  const body = Buffer.from(JSON.stringify({ ...user, exp })).toString("base64url");
  const sig = createHmac("sha256", devSecret()).update(body).digest("base64url");
  return { value: body + "." + sig, maxAge: DEV_SESSION_DAYS * 86_400 };
}

function readDevSession(value: string | undefined): SessionUser | null {
  if (!value) return null;
  const [body, sig] = value.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", devSecret()).update(body).digest("base64url");
  if (expected !== sig) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionUser & { exp: number };
    if (data.exp < Date.now()) return null;
    return { id: data.id, email: data.email, name: data.name };
  } catch {
    return null;
  }
}

export function devUserId(email: string): string {
  return "dev_" + createHash("sha256").update(email.toLowerCase()).digest("hex").slice(0, 24);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  if (authMode() === "neon") {
    try {
      const a = await auth();
      const data = await a.api.getSession({ headers: await headers() });
      const u = data?.user;
      if (u && (u as { banned?: boolean | null }).banned) return null;
      if (!u) return null;
      return { id: u.id, email: u.email, name: u.name ?? null };
    } catch (err) {
      console.error(JSON.stringify({ level: "error", msg: "auth_session_failed", err: String(err) }));
      return null;
    }
  }
  if (!devAuthAllowed()) return null;
  const jar = await cookies();
  return readDevSession(jar.get(DEV_COOKIE)?.value);
}
