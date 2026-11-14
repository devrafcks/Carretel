/**
 * Assinatura R$ 35/mês — AbacatePay API v2 (Modo Teste).
 * Sem ABACATEPAY_API_KEY: modo SIMULADO (só fora de produção) para exercitar o fluxo inteiro
 * freemium → paywall → completed → renovação → falha → read_only → cancelamento.
 * ⚠️ Conferir na doc (https://docs.abacatepay.com) os nomes exatos de endpoints/campos antes do go-live.
 */
import "server-only";
import { eq } from "drizzle-orm";
import { subscriptions, type PlanStatus } from "@/db/schema";
import {
  findSubscriptionByRefs,
  setPlanStatus,
  updateSubscriptionById,
} from "@/db/public";
import type { WorkshopContext } from "@/lib/session";
import { nextPlanStatus, type SubscriptionEventType } from "@/lib/subscription";
import { appUrl } from "@/config/brand";

const API = "https://api.abacatepay.com/v2";

export function billingMode(): "abacatepay" | "simulated" | "disabled" {
  if (process.env.ABACATEPAY_API_KEY) return "abacatepay";
  if (process.env.NODE_ENV !== "production" || process.env.ALLOW_SIMULATED_BILLING === "1") return "simulated";
  return "disabled";
}

function yyyymm(d = new Date()) {
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function abacate<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(API + path, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.ABACATEPAY_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { data?: T; error?: unknown };
  if (!res.ok || json.error) throw new Error(`abacatepay_${res.status}`);
  return json.data as T;
}

export async function startCheckout(ctx: WorkshopContext, method: "PIX" | "CARD", locale: string): Promise<string> {
  const externalId = `ws_${ctx.workshop.id}_${yyyymm()}`;
  const mode = billingMode();
  if (mode === "disabled") throw new Error("billing_disabled");

  let sub = await ctx.tdb.first(subscriptions);
  if (!sub) {
    sub = await ctx.tdb.insert(subscriptions, { status: "pending_checkout", externalId, method });
  } else {
    const [s] = await ctx.tdb.update(subscriptions, { externalId, method, status: "pending_checkout", updatedAt: new Date() }, eq(subscriptions.id, sub.id));
    sub = s ?? sub;
  }
  await setPlanStatus(ctx.workshop.id, nextPlanStatus(ctx.workshop.planStatus, "local.checkout_opened"));

  if (mode === "simulated") {
    return `/${locale}/cuenta/pago-simulado?method=${method}`;
  }

  let customerId = sub.abacateCustomerId;
  if (!customerId) {
    const customer = await abacate<{ id: string }>("/customers/create", {
      email: ctx.user.email,
      name: ctx.workshop.name,
      metadata: { workshopId: ctx.workshop.id },
    });
    customerId = customer.id;
  }
  const productId =
    method === "CARD" && process.env.ABACATEPAY_PRODUCT_ID_MONTHLY_CARD_TRIAL
      ? process.env.ABACATEPAY_PRODUCT_ID_MONTHLY_CARD_TRIAL
      : process.env.ABACATEPAY_PRODUCT_ID_MONTHLY;
  const checkout = await abacate<{ id: string; url: string }>("/subscriptions/create", {
    items: [{ id: productId, quantity: 1 }],
    customerId,
    externalId,
    completionUrl: `${appUrl()}/${locale}/cuenta?checkout=ok`,
    returnUrl: `${appUrl()}/${locale}/cuenta?checkout=cancel`,
    methods: [method],
    retryPolicy: { maxRetry: 3, retryEvery: 2 },
  });
  await ctx.tdb.update(
    subscriptions,
    { abacateCustomerId: customerId, abacateCheckoutId: checkout.id, checkoutUrl: checkout.url, updatedAt: new Date() },
    eq(subscriptions.id, sub.id),
  );
  return checkout.url;
}

export async function cancelSubscription(ctx: WorkshopContext): Promise<void> {
  const sub = await ctx.tdb.first(subscriptions);
  if (!sub) throw new Error("no_subscription");
  if (billingMode() === "abacatepay" && sub.abacateSubscriptionId) {
    await abacate("/subscriptions/cancel", { id: sub.abacateSubscriptionId });
  }
  await ctx.tdb.update(subscriptions, { status: "canceled", canceledAt: new Date(), updatedAt: new Date() }, eq(subscriptions.id, sub.id));
  await setPlanStatus(ctx.workshop.id, nextPlanStatus(ctx.workshop.planStatus, "subscription.cancelled"));
}

export async function requestRefund(ctx: WorkshopContext): Promise<void> {
  const sub = await ctx.tdb.first(subscriptions);
  if (!sub) throw new Error("no_subscription");
  // Endpoint de reembolso NÃO verificado na doc: fluxo manual com SLA ≤ 7 dias (C3.8).
  await ctx.tdb.update(subscriptions, { refundRequestedAt: new Date(), updatedAt: new Date() }, eq(subscriptions.id, sub.id));
  await cancelSubscription(ctx);
}

/* ───── Webhook / eventos ───── */
export interface AbacateEvent {
  id: string;
  event?: string;
  type?: string;
  data?: Record<string, unknown>;
}

function pick(obj: unknown, ...paths: string[]): string | null {
  for (const p of paths) {
    let cur: unknown = obj;
    for (const k of p.split(".")) cur = cur && typeof cur === "object" ? (cur as Record<string, unknown>)[k] : undefined;
    if (typeof cur === "string" && cur) return cur;
  }
  return null;
}

export function eventType(evt: AbacateEvent): string {
  return evt.event ?? evt.type ?? "unknown";
}

export function workshopIdFromExternal(externalId: string | null): string | null {
  const m = externalId?.match(/^ws_([0-9a-f-]{36})_/);
  return m?.[1] ?? null;
}

export async function applySubscriptionEvent(evt: AbacateEvent): Promise<{ workshopId: string | null; status?: PlanStatus }> {
  const type = eventType(evt) as SubscriptionEventType;
  const data = evt.data ?? {};
  const externalId = pick(data, "externalId", "subscription.externalId", "checkout.externalId", "billing.externalId");
  const subscriptionId = pick(data, "subscription.id", "subscriptionId", "id");
  const checkoutId = pick(data, "checkout.id", "checkoutId", "billing.id");
  const method = pick(data, "method", "subscription.method", "payment.method");

  const sub = await findSubscriptionByRefs({ externalId, subscriptionId, checkoutId });
  const workshopId = sub?.workshopId ?? workshopIdFromExternal(externalId);
  if (!sub || !workshopId) return { workshopId: null };

  const { getWorkshopPlan } = await import("@/db/public-billing");
  const current = await getWorkshopPlan(workshopId);
  const next = nextPlanStatus(current ?? "free", type);
  const now = new Date();
  const monthAhead = new Date(now.getTime() + 31 * 86_400_000);
  const set: Partial<typeof subscriptions.$inferInsert> = { status: next };
  if (subscriptionId?.startsWith("subs_")) set.abacateSubscriptionId = subscriptionId;
  if (method === "PIX" || method === "CARD") set.method = method;
  if (type === "subscription.completed" || type === "subscription.renewed" || type === "checkout.completed") {
    set.currentPeriodEnd = monthAhead;
    if (!sub.firstChargedAt) set.firstChargedAt = now;
  }
  if (type === "subscription.trial_started") {
    set.trialEndsAt = new Date(now.getTime() + 7 * 86_400_000);
    set.currentPeriodEnd = set.trialEndsAt;
  }
  if (type === "subscription.cancelled") set.canceledAt = now;
  await updateSubscriptionById(sub.id, set);
  await setPlanStatus(workshopId, next);
  return { workshopId, status: next };
}
