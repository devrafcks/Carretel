/**
 * Login próprio com Better Auth (substitui o Neon Auth gerenciado; mesmas rotas /api/auth/*).
 * - e-mail + senha, SEM confirmação de e-mail (entra direto ao criar a conta);
 * - "Esqueci minha senha" por código de 6 números (plugin email-otp, e-mail via Resend);
 * - plugin admin (papel, banimento) para o painel /admin;
 * - usuários, sessões e senhas no schema app_auth do banco do app (Supabase).
 */
import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, emailOTP } from "better-auth/plugins";
import { getAuthDb, type AuthDb } from "@/db/auth-db";
import * as authSchema from "@/db/auth-schema";
import { appUrl } from "@/config/brand";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/password-strength";
import { sendAuthCode } from "./email";

/** Prefixo dos cookies: carretel.session_token (ou __Secure-carretel.session_token em https). */
export const AUTH_COOKIE_PREFIX = "carretel";

function trustedOrigins(): string[] {
  const list = new Set<string>([appUrl()]);
  if (process.env.VERCEL_URL) list.add(`https://${process.env.VERCEL_URL}`);
  if (process.env.VERCEL_BRANCH_URL) list.add(`https://${process.env.VERCEL_BRANCH_URL}`);
  if (process.env.NODE_ENV !== "production") list.add("http://localhost:3000");
  return [...list];
}

function build(db: AuthDb) {
  return betterAuth({
    appName: "Carretel",
    baseURL: process.env.BETTER_AUTH_URL || appUrl(),
    secret: process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
    trustedOrigins: trustedOrigins(),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      autoSignIn: true,
      minPasswordLength: PASSWORD_MIN_LENGTH,
      maxPasswordLength: PASSWORD_MAX_LENGTH,
      revokeSessionsOnPasswordReset: true,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 dias
      updateAge: 60 * 60 * 24, // renova 1x por dia de uso
    },
    advanced: {
      cookiePrefix: AUTH_COOKIE_PREFIX,
      database: { generateId: "uuid" },
    },
    plugins: [
      admin(),
      emailOTP({
        otpLength: 6,
        expiresIn: 600,
        sendVerificationOTP: async ({ email, otp, type }) => {
          await sendAuthCode(email, otp, type);
        },
      }),
      nextCookies(), // deixa as Server Actions gravarem o cookie de sessão
    ],
  });
}

export type Auth = ReturnType<typeof build>;
const g = globalThis as typeof globalThis & { __carretelAuth?: Promise<Auth> };

/** Instância única por processo (criada na primeira chamada, depois da conexão com o banco). */
export function auth(): Promise<Auth> {
  if (!g.__carretelAuth) {
    g.__carretelAuth = getAuthDb().then(build);
    g.__carretelAuth.catch(() => {
      g.__carretelAuth = undefined;
    });
  }
  return g.__carretelAuth;
}
