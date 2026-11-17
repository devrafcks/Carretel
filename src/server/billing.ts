/**
 * Cobrança do Carretel — AbacatePay API v2 (docs: https://docs.abacatepay.com, conferido em 14/11/2026).
 *
 * Preços (src/config/brand.ts → pricing, regras em src/lib/pricing.ts):
 * - mensal fundador R$ 35 (10 primeiras oficinas pagantes, para sempre) ou mensal padrão R$ 49;
 * - anual R$ 390: PAGAMENTO ÚNICO (POST /checkouts/create) com Pix comum ou cartão em até 12x. Não é assinatura
 *   porque checkout de assinatura não aceita parcelamento ("Subscription checkouts do not support card
 *   installments"). Dá 12 meses de acesso; a renovação abre nos últimos 30 dias e não é automática.
 *
 * Fluxo do mensal:
 * 1) produto com `cycle: "MONTHLY"` (criado sozinho na primeira vez, por externalId, um por preço) — um sem
 *    teste (Pix Automático ou cartão) e um com `trialDays` para o cartão;
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
import { claimPendingSubscription, countFounders } from "@/db/public-billing";
import type { WorkshopContext } from "@/lib/session";
import { nextPlanStatus, type SubscriptionEventType } from "@/lib/subscription";
import {
  annualInstallments,
  annualPeriodEnd,
  annualRenewalOpen,
  choosePriceTier,
  cyclePriceCents,
  foundersLeft,
  hasPaidHistory,
  isActivePlan,
  productExternalId,
  type BillingCycle,
  type PriceTier,
} from "@/lib/pricing";
import { appUrl, brand } from "@/config/brand";

const API = "https://api.abacatepay.com/v2";
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

/**
 * Produto da AbacatePay para (ciclo, preço, teste). Criado uma vez por ambiente e reaproveitado pelo externalId.
 * Os ids de ambiente ABACATEPAY_PRODUCT_ID_MONTHLY(_CARD_TRIAL) continuam valendo para o mensal de fundador.
 */
async function ensureProduct(p: { cycle: BillingCycle; cents: number; trial: boolean }): Promise<string> {
  if (p.cycle === "monthly" && p.cents === brand.pricing.founderMonthlyCents) {
    const envId = p.trial ? process.env.ABACATEPAY_PRODUCT_ID_MONTHLY_CARD_TRIAL : process.env.ABACATEPAY_PRODUCT_ID_MONTHLY;
    if (envId && !envId.includes("xxx")) return envId;
  }
  const externalId = productExternalId(p);
  const cacheKey = `${billingIsTestMode() ? "dev" : "prod"}:${externalId}`;
  const cached = productCache.get(cacheKey);
  if (cached) return cached;

  const found = await abacate<Product[]>("/products/list", { query: { externalId, limit: "1" } });
  let id = found.find((x) => x.externalId === externalId && x.status !== "INACTIVE")?.id;
  if (!id) {
    const name =
      p.cycle === "annual"
        ? `${brand.brandName} — plano anual (12 meses)`
        : p.trial
          ? `${brand.brandName} — plano mensal (cartão, ${brand.cardTrialDays} dias grátis)`
          : `${brand.brandName} — plano mensal`;
    const created = await abacate<Product>("/products/create", {
      body: {
        externalId,
        name,
        description: "Caderno digital do taller de costura: cortes, comprovantes de entrega, acerto da equipe e cobranças.",
        // imagem do produto no checkout da AbacatePay (precisa de endereço público; em dev usa a do site no ar)
        imageUrl: `${/^https:\/\//.test(appUrl()) ? appUrl() : "https://carretel.vercel.app"}/brand/produto-carretel.png`,
        price: p.cents,
        currency: "BRL",
        // anual é avulso (sem cycle) para aceitar Pix comum e parcelamento no cartão
        ...(p.cycle === "monthly" ? { cycle: "MONTHLY" } : {}),
        ...(p.trial ? { trialDays: brand.cardTrialDays } : {}),
      },
    });
    id = created.id;
  }
  productCache.set(cacheKey, id);
  return id;
}

/* ───── Oferta (o que mostrar no checkout e na landing) ───── */
export interface PricingOffer {
  /** faixa que esta oficina paga (ou pagaria) no mensal */
  tier: PriceTier;
  /** assinatura ativa com a faixa travada (renovação) */
  locked: boolean;
  founderSpots: number;
  /** vagas de fundador que sobram (null = não deu para contar) */
  foundersLeft: number | null;
  monthlyCents: number;
  annualCents: number;
  standardMonthlyCents: number;
  annualInstallments: number;
  annualDiscountPct: number;
}

let foundersMemo: { at: number; n: number } | null = null;

/**
 * Oferta para quem está assinando agora (sem oficina = visitante da landing). Nunca quebra a página.
 * `cached`: para telas que só exibem o preço (landing, sidebar), reaproveita a contagem por 60 s.
 * O checkout sempre conta na hora (startCheckout).
 */
export async function pricingOffer(
  sub?: { priceTier: string | null; firstChargedAt: Date | null; trialEndsAt: Date | null; abacateSubscriptionId: string | null } | null,
  workshopId?: string,
  opts: { cached?: boolean; planStatus?: string | null } = {},
): Promise<PricingOffer> {
  const cfg = brand.pricing;
  let taken: number | null = null;
  try {
    if (opts.cached && foundersMemo && foundersMemo.at > Date.now() - 60_000) taken = foundersMemo.n;
    else {
      taken = await countFounders(opts.cached ? undefined : workshopId);
      if (opts.cached) foundersMemo = { at: Date.now(), n: taken };
    }
  } catch (err) {
    console.warn(JSON.stringify({ level: "warn", msg: "count_founders_failed", err: String(err) }));
  }
  const history = hasPaidHistory(sub);
  const lockedTier = sub?.priceTier === "founder" || sub?.priceTier === "standard" ? sub.priceTier : null;
  // sem contagem: na dúvida, mostra o preço padrão (nunca promete uma vaga que pode não existir)
  const activeNow = isActivePlan(opts.planStatus);
  const tier = taken === null && !(activeNow && lockedTier) ? "standard" : choosePriceTier({ lockedTier, activeNow, hasHistory: history, foundersTaken: taken ?? 0, founderSpots: cfg.founderSpots });
  const annualCents = cyclePriceCents(tier, "annual", cfg);
  return {
    tier,
    locked: Boolean(activeNow && lockedTier),
    founderSpots: cfg.founderSpots,
    foundersLeft: taken === null ? null : foundersLeft(taken, cfg.founderSpots),
    monthlyCents: cyclePriceCents(tier, "monthly", cfg),
    annualCents,
    standardMonthlyCents: cfg.standardMonthlyCents,
    annualInstallments: annualInstallments(annualCents, cfg),
    annualDiscountPct: cfg.annualDiscountPct,
  };
}

/** Plano anual ativo nos últimos dias: pode pagar mais 12 meses. */
export function canRenewAnnual(planStatus: WorkshopRow["planStatus"], sub: { billingCycle?: string | null; currentPeriodEnd?: Date | null } | null | undefined, now = new Date()): boolean {
  return planStatus === "active" && annualRenewalOpen(sub, brand.pricing.annualRenewWindowDays, now);
}

/* ───── Checkout ───── */
export async function startCheckout(ctx: WorkshopContext, method: "PIX" | "CARD", locale: string, cycle: BillingCycle = "monthly"): Promise<string> {
  const mode = billingMode();
  if (mode === "disabled") throw new Error("billing_disabled");
  // um externalId novo por tentativa (a API devolve o checkout antigo se o externalId se repetir)
  const externalId = `ws_${ctx.workshop.id}_${method}_${cycle === "annual" ? "A" : "M"}_${Date.now().toString(36)}`;

  let sub = await ctx.tdb.first(subscriptions);
  const plan = ctx.workshop.planStatus;
  const renewingAnnual = cycle === "annual" && sub?.billingCycle === "annual" && canRenewAnnual(plan, sub);
  if ((plan === "active" || plan === "trialing" || plan === "past_due") && !renewingAnnual) throw new Error("already_subscribed");
  // teste grátis no cartão só na primeira assinatura do taller
  const hadSubscription = hasPaidHistory(sub);
  // faixa: renovando com a assinatura ativa mantém a sua; quem volta paga o preço vigente; senão, fundador enquanto houver vaga
  const tier = choosePriceTier({
    lockedTier: sub?.priceTier,
    activeNow: renewingAnnual,
    hasHistory: hadSubscription,
    foundersTaken: await countFounders(ctx.workshop.id),
    founderSpots: brand.pricing.founderSpots,
  });
  const cents = cyclePriceCents(tier, cycle, brand.pricing);
  // fundador que perde a faixa (cancelou e voltou) continua ocupando a vaga: founderAt guarda isso
  const keepsSpot = sub?.priceTier === "founder" && hadSubscription && !sub.founderAt ? { founderAt: new Date() } : {};
  const fields = { externalId, method, status: "pending_checkout", priceTier: tier, billingCycle: cycle, ...keepsSpot } as const;
  if (!sub) {
    sub = await ctx.tdb.insert(subscriptions, fields);
  } else {
    const [s] = await ctx.tdb.update(subscriptions, { ...fields, updatedAt: new Date() }, eq(subscriptions.id, sub.id));
    sub = s ?? sub;
  }
  await setPlanStatus(ctx.workshop.id, nextPlanStatus(ctx.workshop.planStatus, "local.checkout_opened"));

  if (mode === "simulated") return `/${locale}/cuenta/pago-simulado?method=${method}&cycle=${cycle}`;

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

  const completionUrl = `${appUrl()}/${locale}/assinar/concluido`;
  const returnUrl = `${appUrl()}/${locale}/assinar?checkout=cancel`;

  if (cycle === "annual") {
    // pagamento único: Pix comum (não depende do Pix Automático) ou cartão parcelado
    const productId = await ensureProduct({ cycle: "annual", cents, trial: false });
    const checkout = await abacate<{ id: string; url: string }>("/checkouts/create", {
      body: {
        items: [{ id: productId, quantity: 1 }],
        methods: [method],
        ...(customerId ? { customerId } : {}),
        externalId,
        completionUrl,
        returnUrl,
        ...(method === "CARD" ? { card: { maxInstallments: annualInstallments(cents, brand.pricing) } } : {}),
        metadata: { workshopId: ctx.workshop.id, cycle, tier },
      },
    });
    await ctx.tdb.update(
      subscriptions,
      { abacateCustomerId: customerId, abacateCheckoutId: checkout.id, checkoutUrl: checkout.url, updatedAt: new Date() },
      eq(subscriptions.id, sub.id),
    );
    return checkout.url;
  }

  if (method === "PIX" && !pixAutomaticoAvailable()) throw new Error("pix_unavailable");
  const productId = await ensureProduct({ cycle: "monthly", cents, trial: method === "CARD" && !hadSubscription });
  const checkout = await abacate<{ id: string; url: string }>("/subscriptions/create", {
    body: {
      items: [{ id: productId, quantity: 1 }],
      methods: [method],
      ...(customerId ? { customerId } : {}),
      externalId,
      completionUrl,
      returnUrl,
      // assinatura não aceita parcelamento (só 1x)
      ...(method === "CARD" ? { retryPolicy: { maxRetry: 3, retryEvery: 2 }, card: { maxInstallments: 1 } } : {}),
      metadata: { workshopId: ctx.workshop.id, cycle, tier },
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
  // anual vencido (sem renovação automática) → modo leitura; não depende da AbacatePay
  if (ctx.workshop.planStatus === "active") {
    const s = await ctx.tdb.first(subscriptions);
    if (s?.billingCycle === "annual" && s.currentPeriodEnd && s.currentPeriodEnd.getTime() < Date.now()) {
      await updateSubscriptionById(s.id, { status: s.status === "pending_checkout" ? s.status : "read_only" });
      await setPlanStatus(ctx.workshop.id, "read_only");
      ctx = { ...ctx, workshop: { ...ctx.workshop, planStatus: "read_only" } };
      if (s.status !== "pending_checkout") return "read_only";
    }
  }
  if (billingMode() !== "abacatepay") return null;
  const key = ctx.workshop.id;
  if (!opts.force && (lastReconcile.get(key) ?? 0) > Date.now() - 30_000) return null;
  lastReconcile.set(key, Date.now());

  const sub = await ctx.tdb.first(subscriptions);
  if (!sub) return null;

  if (sub.billingCycle === "annual") {
    // pagamento único: confere o checkout em aberto; fora isso não há nada a buscar na AbacatePay
    if (sub.status !== "pending_checkout" || !sub.abacateCheckoutId) return null;
    try {
      const bill = await abacate<{ id: string; status: string }>("/checkouts/get", { query: { id: sub.abacateCheckoutId } });
      if (bill.status !== "PAID") return null;
      return await applyAnnualPayment(sub, ctx.workshop.planStatus, bill.id);
    } catch (err) {
      console.warn(JSON.stringify({ level: "warn", msg: "abacate_reconcile_failed", err: String(err) }));
      return null;
    }
  }

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
      grantedAt: null, // passou a pagar: deixa de ser cortesia
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

type SubscriptionRow = typeof subscriptions.$inferSelect;

/**
 * Anual pago: 12 meses de acesso (somados aos dias que ainda restam, se houver). Idempotente:
 * só aplica se a assinatura ainda estiver aguardando este checkout (webhook e conciliação podem chegar juntos).
 */
async function applyAnnualPayment(sub: SubscriptionRow, current: PlanStatus, checkoutId: string | null): Promise<PlanStatus | null> {
  if (sub.status !== "pending_checkout") return null;
  if (checkoutId && sub.abacateCheckoutId && checkoutId !== sub.abacateCheckoutId) return null;
  const now = new Date();
  const stillPaid = current === "active" || current === "canceled" || current === "past_due";
  const applied = await claimPendingSubscription(sub.id, {
    status: "active",
    currentPeriodEnd: annualPeriodEnd(now, stillPaid ? sub.currentPeriodEnd : null),
    trialEndsAt: null,
    firstChargedAt: sub.firstChargedAt ?? now,
    canceledAt: null,
    grantedAt: null,
    // a assinatura mensal antiga (se havia) já foi cancelada; o anual não tem assinatura na AbacatePay
    abacateSubscriptionId: null,
  });
  if (!applied) return null;
  await setPlanStatus(sub.workshopId, "active");
  return "active";
}

function periodEndFrom(from: Date): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() + 1);
  d.setDate(d.getDate() + GRACE_DAYS);
  return d;
}

/* ───── Cancelamento e reembolso ───── */
/** Cancela na AbacatePay e aqui. Devolve até quando o acesso continua (fim do período já pago ou do teste). */
export async function cancelSubscription(ctx: Pick<WorkshopContext, "tdb" | "workshop">, opts: { endAccessNow?: boolean } = {}): Promise<{ accessUntil: Date | null }> {
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
  const now = new Date();
  // com reembolso o acesso acaba agora; sem reembolso vai até o fim do período já pago (ou do teste)
  const accessUntil = opts.endAccessNow ? now : (sub.currentPeriodEnd ?? sub.trialEndsAt ?? null);
  await ctx.tdb.update(
    subscriptions,
    { status: "canceled", canceledAt: now, updatedAt: now, ...(opts.endAccessNow ? { currentPeriodEnd: now } : {}) },
    eq(subscriptions.id, sub.id),
  );
  await setPlanStatus(ctx.workshop.id, opts.endAccessNow ? "read_only" : nextPlanStatus(ctx.workshop.planStatus, "subscription.cancelled"));
  // acabou de alinhar com a AbacatePay: a próxima tela não precisa conferir de novo
  lastReconcile.set(ctx.workshop.id, Date.now());
  return { accessUntil: accessUntil && accessUntil > now ? accessUntil : null };
}

/**
 * A API da AbacatePay não estorna cobranças de assinatura (só o cliente, pelo Portal, ou o painel).
 * Aqui registramos o pedido (prazo de 7 dias) e cancelamos; o estorno do mensal é feito pelo painel da AbacatePay.
 * O anual é pagamento único: esse a API estorna (POST /checkouts/refund, valor integral).
 */
export async function requestRefund(ctx: WorkshopContext): Promise<{ accessUntil: Date | null }> {
  const sub = await ctx.tdb.first(subscriptions);
  if (!sub) throw new Error("no_subscription");
  await ctx.tdb.update(subscriptions, { refundRequestedAt: new Date(), updatedAt: new Date() }, eq(subscriptions.id, sub.id));
  if (billingMode() === "abacatepay" && sub.billingCycle === "annual" && sub.abacateCheckoutId && sub.status !== "pending_checkout") {
    try {
      await abacate("/checkouts/refund", { body: { id: sub.abacateCheckoutId, reason: "Reembolso pedido pelo taller na tela Conta (prazo de 7 dias)." } });
    } catch (err) {
      // fica registrado (refundRequestedAt) para estornar pelo painel
      console.error(JSON.stringify({ level: "error", msg: "abacate_refund_failed", err: String(err) }));
    }
  }
  return cancelSubscription(ctx, { endAccessNow: true });
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

  if (sub.billingCycle === "annual") {
    // anual = pagamento único: só os eventos de checkout importam (os de assinatura seriam de um mensal antigo)
    if (type === "checkout.completed") {
      const status = await applyAnnualPayment(sub, current ?? "free", checkoutId);
      return { workshopId, status: status ?? current ?? undefined };
    }
    if ((type as string) === "checkout.refunded" && sub.status !== "pending_checkout") {
      const now = new Date();
      await updateSubscriptionById(sub.id, { status: "canceled", canceledAt: sub.canceledAt ?? now, currentPeriodEnd: now });
      await setPlanStatus(workshopId, "read_only");
      return { workshopId, status: "read_only" };
    }
    return { workshopId, status: current ?? undefined };
  }

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
    set.grantedAt = null;
  }
  if (type === "subscription.trial_started") {
    set.trialEndsAt = trialEndsAt ? new Date(trialEndsAt) : new Date(now.getTime() + brand.cardTrialDays * 86_400_000);
    set.currentPeriodEnd = set.trialEndsAt;
    set.grantedAt = null;
  }
  if (type === "subscription.cancelled") set.canceledAt = now;
  await updateSubscriptionById(sub.id, set);
  await setPlanStatus(workshopId, next);
  return { workshopId, status: next };
}
