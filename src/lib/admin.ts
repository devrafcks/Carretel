/**
 * Quem é admin: e-mails em ADMIN_EMAILS (separados por vírgula), conferidos no servidor a cada pedido.
 * Para quem não é admin a área /admin simplesmente não existe (404).
 */
import "server-only";
import { notFound } from "next/navigation";
import { currentUser } from "./session";
import type { SessionUser } from "./auth/server";

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  return Boolean(email) && adminEmails().includes(email!.toLowerCase());
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await currentUser();
  if (!user || !isAdminEmail(user.email)) notFound();
  return user;
}
