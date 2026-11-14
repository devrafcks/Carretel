/**
 * Assinatura R$ 35/mês — AbacatePay API v2 (docs: https://docs.abacatepay.com, conferido em 14/11/2026).
 *
 * Fluxo:
 * 1) produto com `cycle: "MONTHLY"` (criado sozinho na primeira vez, por externalId) — um sem teste (Pix
 *    Automático ou cartão) e um com `trialDays` para o cartão;
 * 2) cliente (POST /customers/create devolve o existente se o e-mail já estiver cadastrado);
 * 3) checkout de assinatura (POST /subscriptions/create) → o taller paga na página da AbacatePay;
 * 4) ativação por webhook (subscription.completed / trial_started / renewed / payment_failed / cancelled)
 *    e, como reforço (localhost não recebe webhook), por conciliação: GET /subscriptions/list?checkoutId=…
 *
 * O ambiente vem da chave: abc_dev_… = Modo Teste (nada é cobrado), abc_prod_… = produção.
 * Sem chave: modo SIMULADO (só fora de produção) para exercitar o fluxo inteiro.
 */
import "server-only";
import { eq } from "drizzle-orm";
import { subscriptions, type PlanStatus } from "@/db/schema";
import { findSubscriptionByRefs, setPlanStatus, updateSubscriptionById } from "@/db/public";
import type { WorkshopContext } from "@/lib/session";
import { nextPlanStatus, type SubscriptionEventType } from "@/lib/subscription";
import { appUrl, brand } from "@/config/brand";

const API = "https://api.abacatepay.com/v2";
const PRODUCT_EXTERNAL_ID = "carretel-mensal";
const PRODUCT_TRIAL_EXTERNAL_ID = "carretel-mensal-teste-cartao";
/** Folga depois do vencimento do ciclo antes de bloquear (o banco/cartão pode demorar). */
const GRACE_DAYS = 3;

export function billingMode(): "abacatepay" | "simulated" | "disabled" {
  if (process.env.ABACATEPAY_API_KEY) return "abacatepay";
  if (process.env.NODE_ENV !== "production" || process.env.ALLOW_SIMULATED_BILLING === "1") return "simulated";
  return "disabled";
}

/**
 * Pix Automático precisa ser liberado pela AbacatePay para cada loja. Enquanto não estiver, a API responde
 * "PIX Automático is not available for this store". Guardamos isso para mostrar o aviso no lugar do botão.
 * ABACATEPAY_PIX_AUTOMATICO=on|off força o comportamento.
 */
let pixUnavailableSince: number | null = null;
export function pixAutomaticoAvailable(): boolean {
  const flag = process.env.ABACATEPAY_PIX_AUTOMATICO;
  if (flag === "off") return false;
  if (flag === "on") return true;
  // revalida de hora em hora (a AbacatePay pode liberar a qualquer momento)
  return !(pixUnavailableSince && Date.now() - pixUnavailableSince < 3_600_000);
}

export function billingIsTestMode(): boolean {
  return (process.env.ABACATEPAY_API_KEY ?? "").startsWith("abc_dev_");
}

class AbacateError extends Error {
  constructor(
    public status: number,
    public apiError: string,
  ) {
    super(`abacatepay_${status}: ${apiError}`);
  }
}

async function abacate<T>(path: string, init: { body?: unknown; query?: Record<string, string> } = {}): Promise<T> {
  const url = new URL(API + path);
  for (const [k, v] of Object.entries(init.query ?? {})) url.searchParams.set(k, v);
  const res = await fetch(url, {
    method: init.body === undefined ? "GET" : "POST",
    headers: { Authorization: `Bearer ${process.env.ABACATEPAY_API_KEY}`, "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { data?: T; error?: string | null; success?: boolean };
  if (!res.ok || json.error) throw new AbacateError(res.status, String(json.error ?? "unknown"));
  return json.data as T;
}

/* ───── Produto (criado uma vez por ambiente) ───── */
type Product = { id: string; externalId: string; status?: string; cycle?: string | null };
const productCache = new Map<string, string>();

async function ensureProduct(trial: boolean): Promise<string> {
  const envId = trial ? process.env.ABACATEPAY_PRODUCT_ID_MONTHLY_CARD_TRIAL : process.env.ABACATEPAY_PRODUCT_ID_MONTHLY;
  if (envId && !envId.includes("xxx")) return envId;
  const externalId = trial ? PRODUCT_TRIAL_EXTERNAL_ID : PRODUCT_EXTERNAL_ID;
  const cacheKey = `${billingIsTestMode() ? "dev" : "prod"}:${externalId}`;
  const cached = productCache.get(cacheKey);
  if (cached) return cached;

  const found = await abacate<Product[]>("/products/list", { query: { externalId, limit: "1" } });
  let id = found.find((p) => p.externalId === externalId && p.status !== "INACTIVE")?.id;
  if (!id) {
    const created = await abacate<Product>("/products/create", {
      body: {
        externalId,
        name: trial ? `${brand.brandName} — plano mensal (cartão, ${brand.cardTrialDays} dias grátis)` : `${brand.brandName} — plano mensal`,
        description: "Caderno digital do taller de costura: cortes, comprovantes de entrega, acerto da equipe e cobranças.",
        price: brand.planPriceCents,
        currency: "BRL",
        cycle: "MONTHLY",
        ...(trial ? { trialDays: brand.cardTrialDays } : {}),
      },
    });
    id = created.id;
  }
  productCache.set(cacheKey, id);
  return id;
}

/* ───── Checkout ───── */
export async function startCheckout(ctx: WorkshopContext, method: "PIX" | "CARD", locale: string): Promise<string> {
  const mode = billingMode();
  if (mode === "disabled") throw new Error("billing_disabled");
  // um externalId novo por tentativa (a API devolve o checkout antigo se o externalId se repetir)
  const externalId = `ws_${ctx.workshop.id}_${method}_${Date.now().toString(36)}`;

  const plan = ctx.workshop.planStatus;
  if (plan === "active" || plan === "trialing" || plan === "past_due") throw new Error("already_subscribed");
  let sub = await ctx.tdb.first(subscriptions);
  // teste grátis no cartão só na primeira assinatura do taller
  const hadSubscription = Boolean(sub?.abacateSubscriptionId || sub?.firstChargedAt || sub?.trialEndsAt);
  if (!sub) {
    sub = await ctx.tdb.insert(subscriptions, { status: "pending_checkout", externalId, method });
  } else {
    const [s] = await ctx.tdb.update(subscriptions, { externalId, method, status: "pending_checkout", updatedAt: new Date() }, eq(subscriptions.id, sub.id));
    sub = s ?? sub;
  }
  await setPlanStatus(ctx.workshop.id, nextPlanStatus(ctx.workshop.planStatus, "local.checkout_opened"));

  if (mode === "simulated") return `/${locale}/cuenta/pago-simulado?method=${method}`;

  let customerId = sub.abacateCustomerId;
  if (!customerId) {
    try {
      const customer = await abacate<{ id: string }>("/customers/create", {
        body: { email: ctx.user.email, name: ctx.workshop.name, metadata: { workshopId: ctx.workshop.id } },
      });
      customerId = customer.id;
    } catch (err) {
      // sem cliente pré-cadastrado o checkout pede os dados; não bloqueia a assinatura
      console.warn(JSON.stringify({ level: "warn", msg: "abacate_customer_failed", err: String(err) }));
    }
  }

  if (method === "PIX" && !pixAutomaticoAvailable()) throw new Error("pix_unavailable");
  const productId = await ensureProduct(method === "CARD" && !hadSubscription);
  const checkout = await abacate<{ id: string; url: string }>("/subscriptions/create", {
    body: {
      items: [{ id: productId, quantity: 1 }],
      methods: [method],
      ...(customerId ? { customerId } : {}),
      externalId,
      completionUrl: `${appUrl()}/${locale}/assinar/concluido`,
      returnUrl: `${appUrl()}/${locale}/assinar?checkout=cancel`,
      ...(method === "CARD" ? { retryPolicy: { maxRetry: 3, retryEvery: 2 }, card: { maxInstallments: 1 } } : {}),
      metadata: { workshopId: ctx.workshop.id },
    },
  }).catch((err: unknown) => {
    if (err instanceof AbacateError && /PIX Autom/i.test(err.apiError)) {
      pixUnavailableSince = Date.now();
      throw new Error("pix_unavailable");
    }
    throw err;
  });
  await ctx.tdb.update(
    subscriptions,
    { abacateCustomerId: customerId, abacateCheckoutId: checkout.id, checkoutUrl: checkout.url, updatedAt: new Date() },
    eq(subscriptions.id, sub.id),
  );
  return checkout.url;
}

/* ───── Conciliação (não depende de webhook) ───── */
type RemoteSubscription = { id: string; checkoutId?: string; status: "PENDING" | "ACTIVE" | "CANCELLED"; method?: "PIX" | "CARD"; trialEndsAt?: string | null; createdAt?: string };
type WorkshopRow = WorkshopContext["workshop"];

const lastReconcile = new Map<string, number>();

/** Precisa conferir com a AbacatePay agora? (checkout em aberto, teste/período vencido) — barato, sem rede. */
export function needsReconcile(workshop: Pick<WorkshopRow, "planStatus">, sub: { status: string; abacateCheckoutId: string | null; currentPeriodEnd: Date | null } | null, now = new Date()): boolean {
  if (!sub) return false;
  if (sub.status === "pending_checkout" && sub.abacateCheckoutId) return true;
  const st = workshop.planStatus;
  return (st === "trialing" || st === "active") && Boolean(sub.currentPeriodEnd && sub.currentPeriodEnd.getTime() < now.getTime());
}

/**
 * Confere na AbacatePay o estado real da assinatura deste taller e aplica no banco. Idempotente.
 * - checkout novo em aberto → procura a assinatura criada por ele (inclusive depois de um cancelamento);
 * - teste que acabou e foi cobrado → ativo; ciclo renovado → estende o período;
 * - cancelada lá (portal, falha de cobrança) → cancelada aqui, mantendo o acesso até o fim do período.
 * `force` ignora o intervalo mínimo de 30 s (usado ao voltar do checkout e na tela Conta).
 */
export async function reconcileSubscription(ctx: Pick<WorkshopContext, "tdb" | "workshop">, opts: { force?: boolean } = {}): Promise<PlanStatus | null> {
  if (billingMode() !== "abacatepay") return null;
  const key = ctx.workshop.id;
  if (!opts.force && (lastReconcile.get(key) ?? 0) > Date.now() - 30_000) return null;
  lastReconcile.set(key, Date.now());

  const sub = await ctx.tdb.first(subscriptions);
  if (!sub) return null;
  let remote: RemoteSubscription | undefined;
  try {
    if (sub.status === "pending_checkout" && sub.abacateCheckoutId) {
      const list = await abacate<RemoteSubscription[]>("/subscriptions/list", { query: { checkoutId: sub.abacateCheckoutId, limit: "5" } });
      remote = list.find((r) => r.status === "ACTIVE");
      if (!remote) return null; // ainda não pagou: nada muda (e quem tem dias pagos continua com eles)
    } else if (sub.abacateSubscriptionId) {
      remote = await abacate<RemoteSubscription>("/subscriptions/get", { query: { id: sub.abacateSubscriptionId } });
    }
  } catch (err) {
    console.warn(JSON.stringify({ level: "warn", msg: "abacate_reconcile_failed", err: String(err) }));
    return null;
  }
  if (!remote) return null;

  const current = ctx.workshop.planStatus;
  const now = new Date();
  if (remote.status === "ACTIVE") {
    // cobrança falhando: a AbacatePay mantém ACTIVE durante as tentativas; quem decide sair do past_due é o webhook "renewed"
    if (current === "past_due" && sub.abacateSubscriptionId === remote.id) return current;
    const trialEnds = remote.trialEndsAt ? new Date(remote.trialEndsAt) : null;
    const inTrial = Boolean(trialEnds && trialEnds > now);
    const desired: PlanStatus = inTrial ? "trialing" : "active";
    const sameSub = sub.abacateSubscriptionId === remote.id;
    const periodOk = Boolean(sub.currentPeriodEnd && sub.currentPeriodEnd > now);
    if (current === desired && sameSub && periodOk && sub.status === desired) return current;

    const leavingTrial = current === "trialing" && !inTrial;
    await updateSubscriptionById(sub.id, {
      status: desired,
      abacateSubscriptionId: remote.id,
      method: remote.method ?? sub.method,
      trialEndsAt: inTrial ? trialEnds : sub.trialEndsAt,
      currentPeriodEnd: inTrial ? trialEnds : sameSub && periodOk && !leavingTrial ? sub.currentPeriodEnd : periodEndFrom(now),
      firstChargedAt: sub.firstChargedAt ?? (inTrial ? null : now),
      canceledAt: null,
    });
    await setPlanStatus(ctx.workshop.id, desired);
    return desired;
  }
  if (remote.status === "CANCELLED" && current !== "canceled" && current !== "read_only") {
    const next = nextPlanStatus(current, "subscription.cancelled");
    await updateSubscriptionById(sub.id, { status: next, canceledAt: sub.canceledAt ?? now });
    await setPlanStatus(ctx.workshop.id, next);
    return next;
  }
  return current;
}

/** Para o cron: concilia um taller pelo id (sem sessão). */
export async function reconcileWorkshopById(workshopId: string): Promise<PlanStatus | null> {
  const { tenantDb } = await import("@/db/tenant");
  const { getWorkshopRow } = await import("@/db/public-billing");
  const workshop = await getWorkshopRow(workshopId);
  if (!workshop) return null;
  return reconcileSubscription({ tdb: await tenantDb(workshopId), workshop }, { force: true });
}

function periodEndFrom(from: Date): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() + 1);
  d.setDate(d.getDate() + GRACE_DAYS);
  return d;
}

/* ───── Cancelamento e reembolso ───── */
export async function cancelSubscription(ctx: Pick<WorkshopContext, "tdb" | "workshop">): Promise<void> {
  const sub = await ctx.tdb.first(subscriptions);
  if (!sub) throw new Error("no_subscription");
  if (billingMode() === "abacatepay" && sub.abacateSubscriptionId) {
    try {
      await abacate("/subscriptions/cancel", { body: { id: sub.abacateSubscriptionId } });
    } catch (err) {
      // já cancelada lá: segue e alinha aqui
      if (!(err instanceof AbacateError && /not active|not found/i.test(err.apiError))) throw err;
    }
  }
  await ctx.tdb.update(subscriptions, { status: "canceled", canceledAt: new Date(), updatedAt: new Date() }, eq(subscriptions.id, sub.id));
  await setPlanStatus(ctx.workshop.id, nextPlanStatus(ctx.workshop.planStatus, "subscription.cancelled"));
}

/**
 * A API da AbacatePay não estorna cobranças de assinatura (só o cliente, pelo Portal, ou o painel).
 * Aqui registramos o pedido (prazo de 7 dias) e cancelamos; o estorno é feito pelo painel da AbacatePay.
 */
export async function requestRefund(ctx: WorkshopContext): Promise<void> {
  const sub = await ctx.tdb.first(subscriptions);
  if (!sub) throw new Error("no_subscription");
  await ctx.tdb.update(subscriptions, { refundRequestedAt: new Date(), updatedAt: new Date() }, eq(subscriptions.id, sub.id));
  await cancelSubscription(ctx);
}

/* ───── Webhook / eventos ───── */
export interface AbacateEvent {
  id: string;
  event?: string;
  type?: string;
  devMode?: boolean;
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

export function eventExternalId(evt: AbacateEvent): string | null {
  return pick(evt.data, "checkout.externalId", "payment.externalId", "subscription.externalId", "externalId");
}

export function workshopIdFromExternal(externalId: string | null): string | null {
  const m = externalId?.match(/^ws_([0-9a-f-]{36})_/);
  return m?.[1] ?? null;
}

export async function applySubscriptionEvent(evt: AbacateEvent): Promise<{ workshopId: string | null; status?: PlanStatus }> {
  const type = eventType(evt) as SubscriptionEventType;
  const data = evt.data ?? {};
  const externalId = eventExternalId(evt);
  const subscriptionId = pick(data, "subscription.id", "subscriptionId");
  const checkoutId = pick(data, "checkout.id", "subscription.checkoutId", "checkoutId");
  const method = pick(data, "subscription.method", "method");
  const trialEndsAt = pick(data, "subscription.trialEndsAt");

  const sub = await findSubscriptionByRefs({ externalId, subscriptionId, checkoutId });
  const workshopId = sub?.workshopId ?? workshopIdFromExternal(externalId);
  if (!sub || !workshopId) return { workshopId: null };

  const { getWorkshopPlan } = await import("@/db/public-billing");
  const current = await getWorkshopPlan(workshopId);
  const next = nextPlanStatus(current ?? "free", type);
  const now = new Date();
  const set: Partial<typeof subscriptions.$inferInsert> = { status: next };
  if (subscriptionId?.startsWith("subs_")) set.abacateSubscriptionId = subscriptionId;
  if (checkoutId?.startsWith("bill_")) set.abacateCheckoutId = checkoutId;
  if (method === "PIX" || method === "CARD") set.method = method;
  if (type === "subscription.completed" || type === "subscription.renewed" || type === "checkout.completed") {
    set.currentPeriodEnd = periodEndFrom(now);
    set.trialEndsAt = null;
    if (!sub.firstChargedAt) set.firstChargedAt = now;
  }
  if (type === "subscription.trial_started") {
    set.trialEndsAt = trialEndsAt ? new Date(trialEndsAt) : new Date(now.getTime() + brand.cardTrialDays * 86_400_000);
    set.currentPeriodEnd = set.trialEndsAt;
  }
  if (type === "subscription.cancelled") set.canceledAt = now;
  await updateSubscriptionById(sub.id, set);
  await setPlanStatus(workshopId, next);
  return { workshopId, status: next };
}
