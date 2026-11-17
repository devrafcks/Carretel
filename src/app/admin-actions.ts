"use server";
/** Ações do painel admin. Cada uma confere o admin de novo no servidor, valida a entrada e registra auditoria. */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { audit } from "@/lib/audit";
import { authMode } from "@/lib/auth/server";
import { auth } from "@/lib/auth/better";
import { appUrl } from "@/config/brand";
import {
  adminDeleteUser,
  adminResetFreeUsage,
  adminRevokeSessions,
  adminSetBanned,
  adminSetPlan,
  adminUserDetail,
  ensureAuthAdminRole,
} from "@/db/admin";
import { tenantDb } from "@/db/tenant";
import { cancelSubscription } from "@/server/billing";
import { getWorkshopRow } from "@/db/public-billing";
import { checkPassword, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/password-strength";

export type AdminResult = { ok: true; message?: string } | { ok: false; error: string };

/** id do Neon Auth (uuid) ou do modo dev (dev_<hex>): só caracteres seguros */
const userIdSchema = z.string().regex(/^[A-Za-z0-9_-]{6,80}$/);

function done(path = "/[locale]/admin", message?: string): AdminResult {
  revalidatePath(path, "layout");
  return { ok: true, message };
}

function errorText(e: unknown): string {
  return e instanceof Error ? e.message.slice(0, 200) : "erro";
}

export async function adminSetPasswordAction(userId: string, newPassword: string): Promise<AdminResult> {
  const admin = await requireAdmin();
  try {
    const id = userIdSchema.parse(userId);
    const pwd = z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH).parse(newPassword);
    if (authMode() !== "neon") return { ok: false, error: "Login não configurado" };
    // mesma regra de força do cadastro (o admin não pode definir uma senha fraca para alguém)
    const detail = await adminUserDetail(id);
    const strength = await checkPassword(pwd, { locales: ["es", "pt-BR"], email: detail?.user.email, name: detail?.user.name });
    if (!strength.ok) return { ok: false, error: "Senha fraca: use uma frase com 3 ou 4 palavras ou mais caracteres" };
    await ensureAuthAdminRole(admin.email);
    // grava o hash pelo próprio Better Auth (mesmo formato do cadastro)
    const ctx = await (await auth()).$context;
    await ctx.internalAdapter.updatePassword(id, await ctx.password.hash(pwd));
    await adminRevokeSessions(id); // senha nova derruba as sessões abertas
    await audit("admin.set_password", { userId: admin.id, resource: id });
    return done();
  } catch (e) {
    return { ok: false, error: errorText(e) };
  }
}

export async function adminSendResetLinkAction(userId: string, locale: string): Promise<AdminResult> {
  const admin = await requireAdmin();
  try {
    const detail = await adminUserDetail(userIdSchema.parse(userId));
    if (!detail) return { ok: false, error: "usuário não encontrado" };
    void locale;
    // mesmo fluxo do "Esqueci minha senha": código de 6 números pelo e-mail (Gmail/SMTP)
    const res = await fetch(`${appUrl()}/api/auth/email-otp/request-password-reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: appUrl() },
      body: JSON.stringify({ email: detail.user.email }),
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, error: `O login recusou (${res.status})` };
    await audit("admin.reset_link", { userId: admin.id, resource: userId });
    return done(undefined, "Código enviado para o e-mail do usuário");
  } catch (e) {
    return { ok: false, error: errorText(e) };
  }
}

export async function adminBanAction(userId: string, banned: boolean, reason: string): Promise<AdminResult> {
  const admin = await requireAdmin();
  try {
    const id = userIdSchema.parse(userId);
    if (id === admin.id) return { ok: false, error: "Você não pode bloquear a própria conta" };
    await adminSetBanned(id, z.boolean().parse(banned), z.string().max(200).parse(reason || "") || null);
    await audit(banned ? "admin.ban" : "admin.unban", { userId: admin.id, resource: id });
    return done();
  } catch (e) {
    return { ok: false, error: errorText(e) };
  }
}

export async function adminRevokeSessionsAction(userId: string): Promise<AdminResult> {
  const admin = await requireAdmin();
  try {
    const id = userIdSchema.parse(userId);
    await adminRevokeSessions(id);
    await audit("admin.revoke_sessions", { userId: admin.id, resource: id });
    return done();
  } catch (e) {
    return { ok: false, error: errorText(e) };
  }
}

export async function adminCancelSubscriptionAction(workshopId: string): Promise<AdminResult> {
  const admin = await requireAdmin();
  try {
    const id = z.string().uuid().parse(workshopId);
    const workshop = await getWorkshopRow(id);
    if (!workshop) return { ok: false, error: "taller não encontrado" };
    await cancelSubscription({ tdb: await tenantDb(id), workshop });
    await audit("admin.cancel_subscription", { userId: admin.id, workshopId: id });
    return done();
  } catch (e) {
    return { ok: false, error: errorText(e) };
  }
}

const PLAN = z.enum(["free", "active", "trialing", "canceled", "read_only"]);

export async function adminSetPlanAction(workshopId: string, status: string, days: number): Promise<AdminResult> {
  const admin = await requireAdmin();
  try {
    const id = z.string().uuid().parse(workshopId);
    const st = PLAN.parse(status);
    const d = z.number().int().min(0).max(3650).parse(days);
    const periodEnd = st === "active" || st === "trialing" || st === "canceled" ? new Date(Date.now() + d * 86_400_000) : null;
    await adminSetPlan(id, st, periodEnd);
    await audit("admin.set_plan", { userId: admin.id, workshopId: id, resource: `${st}:${d}d` });
    return done();
  } catch (e) {
    return { ok: false, error: errorText(e) };
  }
}

export async function adminResetFreeAction(workshopId: string): Promise<AdminResult> {
  const admin = await requireAdmin();
  try {
    const id = z.string().uuid().parse(workshopId);
    await adminResetFreeUsage(id);
    await audit("admin.reset_free", { userId: admin.id, workshopId: id });
    return done();
  } catch (e) {
    return { ok: false, error: errorText(e) };
  }
}

export async function adminDeleteUserAction(userId: string, confirmEmail: string): Promise<AdminResult> {
  const admin = await requireAdmin();
  try {
    const id = userIdSchema.parse(userId);
    if (id === admin.id) return { ok: false, error: "Você não pode apagar a própria conta por aqui" };
    const detail = await adminUserDetail(id);
    if (!detail) return { ok: false, error: "usuário não encontrado" };
    if (z.string().max(320).parse(confirmEmail).trim().toLowerCase() !== detail.user.email.toLowerCase()) return { ok: false, error: "O e-mail digitado não confere" };
    // cancela a cobrança antes de apagar, para não continuar cobrando
    if (detail.workshop && detail.subscription && ["active", "trialing", "past_due"].includes(detail.workshop.plan_status)) {
      const workshop = await getWorkshopRow(detail.workshop.id);
      if (workshop) await cancelSubscription({ tdb: await tenantDb(workshop.id), workshop }).catch(() => undefined);
    }
    await adminDeleteUser(id);
    await audit("admin.delete_user", { userId: admin.id, resource: `${id}:${detail.user.email}` });
    return done();
  } catch (e) {
    return { ok: false, error: errorText(e) };
  }
}
