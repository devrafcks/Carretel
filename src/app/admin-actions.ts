"use server";
/** Ações do painel admin. Cada uma confere o admin de novo no servidor, valida a entrada e registra auditoria. */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { reportError } from "@/server/log";
import { requireAdmin } from "@/lib/admin";
import { audit } from "@/lib/audit";
import { authMode } from "@/lib/auth/server";
import { auth } from "@/lib/auth/better";
import {
  adminDeleteUser,
  adminEndGrant,
  adminExtendGrant,
  adminGrantPlan,
  adminHasPaidPlan,
  adminResolveErrorGroup,
  adminResolveRefund,
  adminSaveNote,
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

export type AdminResult = { ok: true; message?: string; code?: string } | { ok: false; error: string };

/** id do Neon Auth (uuid) ou do modo dev (dev_<hex>): só caracteres seguros */
const userIdSchema = z.string().regex(/^[A-Za-z0-9_-]{6,80}$/);

function done(path = "/[locale]/admin", message?: string): AdminResult {
  revalidatePath(path, "layout");
  return { ok: true, message };
}

/** Erro de validação aparece como veio; erro inesperado é registrado e mostra o código (procure em /admin/erros). */
function errorText(e: unknown): string {
  if (e instanceof z.ZodError) return "Dados inválidos: " + (e.issues[0]?.message ?? "confira os campos");
  const ref = reportError("admin_action_failed", e, { source: "action", level: "warn" });
  return `${e instanceof Error ? e.message.slice(0, 160) : "erro"} (código ${ref})`;
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

/** Gera um código de 6 números para a pessoa criar uma senha nova (vale 30 min). Nada é enviado: o admin passa o código. */
export async function adminCreateResetCodeAction(userId: string): Promise<AdminResult> {
  const admin = await requireAdmin();
  try {
    const detail = await adminUserDetail(userIdSchema.parse(userId));
    if (!detail) return { ok: false, error: "usuário não encontrado" };
    if (authMode() !== "neon") return { ok: false, error: "Login não configurado" };
    const code = await (await auth()).api.createVerificationOTP({ body: { email: detail.user.email, type: "forget-password" } });
    await audit("admin.reset_code", { userId: admin.id, resource: userId });
    return { ok: true, message: "Código gerado", code: String(code) };
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

/** Libera o plano completo sem cobrança. days 0 = sem prazo. */
export async function adminGrantPlanAction(workshopId: string, days: number, note: string): Promise<AdminResult> {
  const admin = await requireAdmin();
  try {
    const id = z.string().uuid().parse(workshopId);
    const d = z.number().int().min(0).max(3650).parse(days);
    const n = z.string().max(300).parse(note || "").trim() || null;
    if (await adminHasPaidPlan(id)) return { ok: false, error: "Este taller tem assinatura paga em andamento. Cancele a assinatura antes de dar cortesia." };
    const end = d ? new Date(Date.now() + d * 86_400_000) : null;
    await adminGrantPlan(id, end, n);
    await audit("admin.grant_plan", { userId: admin.id, workshopId: id, resource: d ? `${d}d` : "sem_prazo" });
    return done("/[locale]/admin", d ? `Plano completo liberado por ${d} dias` : "Plano completo liberado sem prazo");
  } catch (e) {
    return { ok: false, error: errorText(e) };
  }
}

export async function adminExtendGrantAction(workshopId: string, days: number): Promise<AdminResult> {
  const admin = await requireAdmin();
  try {
    const id = z.string().uuid().parse(workshopId);
    const d = z.number().int().min(1).max(3650).parse(days);
    if (!(await adminExtendGrant(id, d))) return { ok: false, error: "Não há cortesia com prazo para estender" };
    await audit("admin.extend_grant", { userId: admin.id, workshopId: id, resource: `+${d}d` });
    return done("/[locale]/admin", `+${d} dias de cortesia`);
  } catch (e) {
    return { ok: false, error: errorText(e) };
  }
}

export async function adminEndGrantAction(workshopId: string): Promise<AdminResult> {
  const admin = await requireAdmin();
  try {
    const id = z.string().uuid().parse(workshopId);
    await adminEndGrant(id);
    await audit("admin.end_grant", { userId: admin.id, workshopId: id });
    return done("/[locale]/admin", "Cortesia encerrada: voltou para o plano grátis");
  } catch (e) {
    return { ok: false, error: errorText(e) };
  }
}

export async function adminResolveRefundAction(workshopId: string): Promise<AdminResult> {
  const admin = await requireAdmin();
  try {
    const id = z.string().uuid().parse(workshopId);
    await adminResolveRefund(id);
    await audit("admin.refund_resolved", { userId: admin.id, workshopId: id });
    return done("/[locale]/admin", "Reembolso marcado como resolvido");
  } catch (e) {
    return { ok: false, error: errorText(e) };
  }
}

export async function adminSaveNoteAction(workshopId: string, note: string): Promise<AdminResult> {
  const admin = await requireAdmin();
  try {
    const id = z.string().uuid().parse(workshopId);
    const n = z.string().max(2000).parse(note || "").trim() || null;
    await adminSaveNote(id, n);
    await audit("admin.note", { userId: admin.id, workshopId: id });
    return done("/[locale]/admin", "Anotação salva");
  } catch (e) {
    return { ok: false, error: errorText(e) };
  }
}

export async function adminResolveErrorAction(fingerprint: string, resolved: boolean): Promise<AdminResult> {
  const admin = await requireAdmin();
  try {
    const fp = z.string().regex(/^[0-9a-f]{16}$/).parse(fingerprint);
    await adminResolveErrorGroup(fp, z.boolean().parse(resolved));
    await audit("admin.error_resolved", { userId: admin.id, resource: `${fp}:${resolved ? "resolvido" : "reaberto"}` });
    return done("/[locale]/admin", resolved ? "Marcado como resolvido" : "Reaberto");
  } catch (e) {
    return { ok: false, error: errorText(e) };
  }
}
