/**
 * Autenticação sem senha (OTP de 6 dígitos por e-mail).
 * - Produção: Neon Auth (Managed Better Auth) — envia o e-mail e guarda users/sessions no schema neon_auth.
 * - Dev sem NEON_AUTH_BASE_URL: modo local; o código aparece no console do servidor e na tela.
 */
import "server-only";
import { cookies } from "next/headers";
import { createHash, createHmac } from "node:crypto";
import { createNeonAuth } from "@neon/auth/next/server";

export type SessionUser = { id: string; email: string; name: string | null };
export type AuthMode = "neon" | "dev";

export function authMode(): AuthMode {
  return process.env.NEON_AUTH_BASE_URL && process.env.NEON_AUTH_COOKIE_SECRET ? "neon" : "dev";
}

export function devAuthAllowed(): boolean {
  return authMode() === "dev" && (process.env.NODE_ENV !== "production" || process.env.ALLOW_DEV_AUTH === "1");
}

type NeonAuthInstance = ReturnType<typeof createNeonAuth>;
const g = globalThis as typeof globalThis & { __carretelNeonAuth?: NeonAuthInstance };

export function neonAuth(): NeonAuthInstance {
  if (!g.__carretelNeonAuth) {
    g.__carretelNeonAuth = createNeonAuth({
      baseUrl: process.env.NEON_AUTH_BASE_URL!,
      cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET! },
    });
  }
  return g.__carretelNeonAuth;
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
      const { data } = await neonAuth().getSession();
      const u = data?.user;
      if (!u) return null;
      return { id: u.id, email: u.email, name: u.name ?? null };
    } catch (err) {
      console.error(JSON.stringify({ level: "error", msg: "neon_auth_session_failed", err: String(err) }));
      return null;
    }
  }
  if (!devAuthAllowed()) return null;
  const jar = await cookies();
  return readDevSession(jar.get(DEV_COOKIE)?.value);
}
