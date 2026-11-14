"use server";
/**
 * Server Actions. Toda action: sessão + workshop (requireWorkshop) + zod + status do plano.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { clients, workers, workshopSettings, settlements, type CalculatorProfile } from "@/db/schema";
import { createWorkshopForUser, softDeleteWorkshop, updateWorkshopRow, setPlanStatus } from "@/db/public";
import { requireUser, requireWorkshop } from "@/lib/session";
import { deliverySchema, workshopCreateSchema, clientCreateSchema, workerCreateSchema } from "@/lib/schemas";
import { audit, requestMeta } from "@/lib/audit";
import { legal } from "@/config/legal";
import { encryptField, last3 } from "@/lib/crypto";
import { normalizePixKey } from "@/lib/pix-brcode";
import { isValidCnpj, isValidCpf, isValidRnm, toE164 } from "@/lib/validators";
import {
  DomainError,
  anonymizeClientCore,
  anonymizeWorkerCore,
  assumeReceivableCore,
  closeSettlementCore,
  createAdjustmentCore,
  createClientCore,
  createWorkerCore,
  markChargedCore,
  markSettlementPaidCore,
  registerDeliveryCore,
  reopenSettlementCore,
  revokeProofCore,
  setBatchStatusCore,
  upsertOperationCore,
  writeOffCore,
} from "@/server/core";
import { cancelSubscription, requestRefund, startCheckout, applySubscriptionEvent, billingMode } from "@/server/billing";
import { TenantNotFoundError } from "@/db/tenant";
import { nextPlanStatus } from "@/lib/subscription";

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string; field?: string };

function fail(err: unknown): { ok: false; error: string; field?: string } {
  if (err instanceof DomainError) return { ok: false, error: err.code };
  if (err instanceof TenantNotFoundError) return { ok: false, error: "not_found" };
  if (err instanceof z.ZodError) {
    const issue = err.issues[0];
    return { ok: false, error: issue?.message?.startsWith("grid_mismatch") ? issue.message : "validation", field: issue?.path.join(".") };
  }
  const msg = String((err as Error)?.message ?? err);
  if (msg.includes("delivery_proof_locked")) return { ok: false, error: "proof_locked" };
  if (msg.includes("settlement_locked")) return { ok: false, error: "settlement_locked" };
  console.error(JSON.stringify({ level: "error", msg: "action_failed", err: msg }));
  return { ok: false, error: "server_error" };
}

function revalidateApp() {
  revalidatePath("/[locale]", "layout");
}

/* ───── Onboarding ───── */
export async function createWorkshopAction(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const locale = await getLocale();
  const parsed = workshopCreateSchema.safeParse({
    name: form.get("name"),
    district: form.get("district") || undefined,
    city: form.get("city") || undefined,
    machineCount: Number(form.get("machineCount") || 1),
    pixKeyType: form.get("pixKeyType") || undefined,
    pixKey: form.get("pixKey") || undefined,
    pixMerchantName: form.get("pixMerchantName") || undefined,
    pixCity: form.get("pixCity") || undefined,
    acceptTerms: form.get("acceptTerms") === "on",
    acceptPrivacy: form.get("acceptPrivacy") === "on",
    acceptNoForcedLabor: form.get("acceptNoForcedLabor") === "on",
    locale,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue?.path[0]?.toString().startsWith("accept") ? "accept_required" : "validation", field: issue?.path.join(".") };
  }
  const v = parsed.data;
  const meta = await requestMeta();
  const workshopId = await createWorkshopForUser({
    userId: user.id,
    email: user.email,
    workshop: {
      name: v.name,
      district: v.district ?? null,
      city: v.city ?? "São Paulo",
      machineCount: v.machineCount,
      pixKeyType: v.pixKey ? v.pixKeyType ?? "evp" : null,
      pixKey: v.pixKey ? normalizePixKey(v.pixKey, v.pixKeyType) : null,
      pixMerchantName: v.pixKey ? v.pixMerchantName ?? v.name : null,
      pixCity: v.pixKey ? v.pixCity ?? v.city ?? "Sao Paulo" : null,
      defaultLocale: v.locale,
    },
    acceptances: [
      { document: "terms", version: legal.documentVersions.terms, locale },
      { document: "privacy", version: legal.documentVersions.privacy, locale },
      { document: "no_forced_labor", version: legal.documentVersions.no_forced_labor, locale },
    ],
    ip: meta.ip,
    userAgent: meta.ua,
  });
  await audit("auth.signup", { workshopId, userId: user.id });
  redirect(`/${locale}/hoy?welcome=1`);
}

/* ───── Lotes ───── */
export async function setBatchStatusAction(batchId: string, status: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkshop();
    await setBatchStatusCore(ctx, batchId, status);
    revalidateApp();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function upsertOperationAction(batchId: string, machine: string, pieceRateCents: number): Promise<ActionResult> {
  try {
    const ctx = await requireWorkshop();
    const m = z.enum(["recta", "overlock", "collareta", "interlock", "other"]).parse(machine);
    await upsertOperationCore(ctx, batchId, m, z.number().int().min(1).parse(pieceRateCents));
    revalidateApp();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function registerDeliveryAction(input: unknown, previousProofId?: string): Promise<ActionResult<{ token: string; proofId: string }>> {
  try {
    const ctx = await requireWorkshop();
    const v = deliverySchema.parse(input);
    const p = await registerDeliveryCore(ctx, v, previousProofId);
    revalidateApp();
    return { ok: true, data: { token: p.publicToken, proofId: p.id } };
  } catch (e) {
    return fail(e);
  }
}

export async function revokeProofAction(proofId: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkshop();
    await revokeProofCore(ctx, proofId);
    revalidateApp();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/* ───── Contratantes e equipe ───── */
export async function createClientAction(input: z.input<typeof clientCreateSchema>): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    const ctx = await requireWorkshop();
    const c = await createClientCore(ctx, input);
    revalidateApp();
    return { ok: true, data: { id: c.id, name: c.name } };
  } catch (e) {
    return fail(e);
  }
}

export async function updateClientAction(clientId: string, input: { name: string; phone?: string; preferredLocale: "es" | "pt-BR" }): Promise<ActionResult> {
  try {
    const ctx = await requireWorkshop();
    const v = clientCreateSchema.parse(input);
    await ctx.tdb.update(clients, { name: v.name, phoneE164: v.phone ? toE164(v.phone) : null, preferredLocale: v.preferredLocale, updatedAt: new Date() }, eq(clients.id, clientId));
    revalidateApp();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function anonymizeClientAction(clientId: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkshop();
    await anonymizeClientCore(ctx, clientId);
    revalidateApp();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function createWorkerAction(input: z.input<typeof workerCreateSchema>): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireWorkshop();
    if (input.docNumber) {
      const okDoc = input.docType === "rnm" ? isValidRnm(input.docNumber) : isValidCpf(input.docNumber);
      if (!okDoc) return { ok: false, error: "doc_invalid", field: "docNumber" };
    }
    const w = await createWorkerCore(ctx, input);
    revalidateApp();
    return { ok: true, data: { id: w.id } };
  } catch (e) {
    return fail(e);
  }
}

export async function updateWorkerAction(workerId: string, input: { name: string; phone?: string; isEmployee: boolean; active: boolean }): Promise<ActionResult> {
  try {
    const ctx = await requireWorkshop();
    await ctx.tdb.update(
      workers,
      { name: z.string().trim().min(1).max(120).parse(input.name), phoneE164: input.phone ? toE164(input.phone) : null, isEmployee: input.isEmployee, active: input.active, updatedAt: new Date() },
      eq(workers.id, workerId),
    );
    revalidateApp();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function anonymizeWorkerAction(workerId: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkshop();
    await anonymizeWorkerCore(ctx, workerId);
    revalidateApp();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/* ───── Acerto ───── */
const periodSchema = z.object({ start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

export async function closeSettlementAction(workerId: string, period: { start: string; end: string }): Promise<ActionResult<{ id: string; token: string }>> {
  try {
    const ctx = await requireWorkshop();
    const s = await closeSettlementCore(ctx, workerId, periodSchema.parse(period));
    revalidateApp();
    return { ok: true, data: { id: s.id, token: s.publicToken } };
  } catch (e) {
    return fail(e);
  }
}

export async function reopenSettlementAction(settlementId: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkshop();
    await reopenSettlementCore(ctx, settlementId);
    revalidateApp();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function markSettlementPaidAction(settlementId: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkshop();
    await markSettlementPaidCore(ctx, settlementId);
    revalidateApp();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function createAdjustmentAction(settlementId: string, amountCents: number, note: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkshop();
    await createAdjustmentCore(ctx, settlementId, z.number().int().parse(amountCents), z.string().trim().min(1).max(200).parse(note));
    revalidateApp();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function settlementTokenAction(settlementId: string): Promise<ActionResult<{ token: string }>> {
  try {
    const ctx = await requireWorkshop();
    const s = await ctx.tdb.get(settlements, eq(settlements.id, settlementId), "settlement");
    return { ok: true, data: { token: s.publicToken } };
  } catch (e) {
    return fail(e);
  }
}

/* ───── Cobrança ───── */
export async function writeOffAction(receivableId: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkshop();
    await writeOffCore(ctx, receivableId);
    revalidateApp();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function assumeReceivableAction(receivableId: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkshop();
    await assumeReceivableCore(ctx, receivableId);
    revalidateApp();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function markChargedAction(receivableId: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkshop();
    await markChargedCore(ctx, receivableId);
    revalidateApp();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/* ───── Conta ───── */
export async function updateWorkshopAction(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  try {
    const ctx = await requireWorkshop();
    const name = z.string().trim().min(2).max(80).parse(form.get("name"));
    const docType = (form.get("docType") as string) || "";
    const docNumber = ((form.get("docNumber") as string) || "").trim();
    const set: Record<string, unknown> = {
      name,
      district: (form.get("district") as string)?.trim() || null,
      city: (form.get("city") as string)?.trim() || null,
      machineCount: z.coerce.number().int().min(1).max(200).parse(form.get("machineCount") || 1),
      phoneE164: form.get("phone") ? toE164(String(form.get("phone"))) : null,
    };
    if (docNumber) {
      const valid = docType === "cpf" ? isValidCpf(docNumber) : docType === "cnpj" ? isValidCnpj(docNumber) : docType === "rnm" ? isValidRnm(docNumber) : false;
      if (!valid) return { ok: false, error: "doc_invalid", field: "docNumber" };
      set.docType = docType;
      set.docNumberEnc = encryptField(docNumber);
      set.docLast3 = last3(docNumber);
    }
    await updateWorkshopRow(ctx.workshop.id, set);
    revalidateApp();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updatePixAction(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  try {
    const ctx = await requireWorkshop();
    const type = z.enum(["evp", "phone", "email", "cpf", "cnpj"]).parse(form.get("pixKeyType"));
    const key = z.string().trim().min(3).max(77).parse(form.get("pixKey"));
    await updateWorkshopRow(ctx.workshop.id, {
      pixKeyType: type,
      pixKey: normalizePixKey(key, type),
      pixMerchantName: z.string().trim().min(1).max(25).parse(form.get("pixMerchantName")),
      pixCity: z.string().trim().min(1).max(15).parse(form.get("pixCity")),
    });
    revalidateApp();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function saveCalculatorProfileAction(profile: CalculatorProfile): Promise<ActionResult> {
  try {
    const ctx = await requireWorkshop();
    const p = z
      .object({
        fixedMonthlyCents: z.number().int().min(0),
        payrollMonthlyCents: z.number().int().min(0),
        people: z.number().min(1).max(500),
        hoursPerDay: z.number().min(0.5).max(24),
        daysPerMonth: z.number().min(1).max(31),
        marginPct: z.number().min(0).max(300),
      })
      .parse(profile);
    const existing = await ctx.tdb.first(workshopSettings);
    if (existing) await ctx.tdb.update(workshopSettings, { calculatorProfile: p, updatedAt: new Date() }, eq(workshopSettings.workshopId, ctx.workshop.id));
    else await ctx.tdb.insert(workshopSettings, { calculatorProfile: p });
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function saveSettingsAction(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  try {
    const ctx = await requireWorkshop();
    const maxHours = form.get("maxHoursPerDay") ? String(z.coerce.number().min(1).max(24).parse(form.get("maxHoursPerDay"))) : null;
    const period = z.enum(["weekly", "biweekly"]).parse(form.get("settlementPeriod") || "weekly");
    const existing = await ctx.tdb.first(workshopSettings);
    if (existing) await ctx.tdb.update(workshopSettings, { maxHoursPerDay: maxHours, settlementPeriod: period, updatedAt: new Date() }, eq(workshopSettings.workshopId, ctx.workshop.id));
    else await ctx.tdb.insert(workshopSettings, { maxHoursPerDay: maxHours, settlementPeriod: period });
    revalidateApp();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function startCheckoutAction(method: "PIX" | "CARD"): Promise<ActionResult<{ url: string }>> {
  try {
    const ctx = await requireWorkshop();
    const locale = await getLocale();
    const url = await startCheckout(ctx, method, locale);
    await audit("subscription.checkout", { workshopId: ctx.workshop.id, userId: ctx.user.id, resource: method });
    return { ok: true, data: { url } };
  } catch (e) {
    return fail(e);
  }
}

/** Só no modo simulado (sem chave AbacatePay, fora de produção). */
export async function simulateBillingEventAction(event: string): Promise<ActionResult> {
  try {
    if (billingMode() !== "simulated") return { ok: false, error: "not_simulated" };
    const ctx = await requireWorkshop();
    const sub = ctx.subscription;
    if (!sub?.externalId) return { ok: false, error: "no_subscription" };
    const allowed = ["subscription.completed", "subscription.trial_started", "subscription.renewed", "subscription.payment_failed", "subscription.cancelled", "local.period_expired"];
    if (!allowed.includes(event)) return { ok: false, error: "validation" };
    if (event === "local.period_expired") {
      await setPlanStatus(ctx.workshop.id, nextPlanStatus(ctx.workshop.planStatus, "local.period_expired"));
    } else {
      await applySubscriptionEvent({
        id: "log_sim_" + Date.now(),
        event,
        data: { externalId: sub.externalId, subscription: { id: "subs_sim_" + ctx.workshop.id.slice(0, 8) }, method: sub.method ?? "PIX" },
      });
    }
    revalidateApp();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function cancelSubscriptionAction(withRefund: boolean): Promise<ActionResult> {
  try {
    const ctx = await requireWorkshop();
    if (withRefund) await requestRefund(ctx);
    else await cancelSubscription(ctx);
    await audit(withRefund ? "subscription.refund_request" : "subscription.cancel", { workshopId: ctx.workshop.id, userId: ctx.user.id });
    revalidateApp();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteAccountAction(confirmName: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkshop();
    if (confirmName.trim() !== ctx.workshop.name.trim()) return { ok: false, error: "name_mismatch" };
    await softDeleteWorkshop(ctx.workshop.id);
    await audit("account.delete", { workshopId: ctx.workshop.id, userId: ctx.user.id });
    revalidateApp();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
