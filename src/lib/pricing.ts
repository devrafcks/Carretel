/**
 * Regras de preço (puras, sem banco): faixa de fundador, preço por ciclo e plano anual.
 *
 * - As primeiras `founderSpots` oficinas que pagam ficam na faixa "founder" (R$ 35/mês) para sempre:
 *   renovação nunca muda o preço, e quem cancela e volta continua fundador.
 * - "Pagou alguma vez" = a assinatura tem histórico (teste iniciado, primeira cobrança ou id de assinatura
 *   na AbacatePay). Checkout aberto e abandonado não ocupa vaga.
 * - Esgotadas as vagas, assinaturas novas entram na faixa "standard" (R$ 49/mês).
 */
import type { PricingConfig } from "@/config/brand";

export type PriceTier = "founder" | "standard";
export type BillingCycle = "monthly" | "annual";

export const PRICE_TIERS: readonly PriceTier[] = ["founder", "standard"];
export const BILLING_CYCLES: readonly BillingCycle[] = ["monthly", "annual"];

export interface SubscriptionHistory {
  firstChargedAt?: Date | null;
  trialEndsAt?: Date | null;
  abacateSubscriptionId?: string | null;
}

/** A oficina já pagou (ou começou o teste) alguma vez? Só então a faixa fica travada e a vaga conta. */
export function hasPaidHistory(sub: SubscriptionHistory | null | undefined): boolean {
  return Boolean(sub && (sub.firstChargedAt || sub.trialEndsAt || sub.abacateSubscriptionId));
}

export function isPriceTier(v: unknown): v is PriceTier {
  return v === "founder" || v === "standard";
}

/**
 * Faixa de preço para um checkout novo.
 * @param lockedTier faixa já gravada na assinatura desta oficina (ou null)
 * @param hasHistory a oficina já pagou alguma vez (ver hasPaidHistory)
 * @param foundersTaken oficinas com histórico na faixa de fundador, sem contar esta
 */
export function choosePriceTier(i: { lockedTier: PriceTier | null | undefined; hasHistory: boolean; foundersTaken: number; founderSpots: number }): PriceTier {
  // quem já pagou mantém a faixa em que entrou (cancelar e voltar não muda o preço)
  if (i.hasHistory && isPriceTier(i.lockedTier)) return i.lockedTier;
  return i.foundersTaken < i.founderSpots ? "founder" : "standard";
}

export function foundersLeft(foundersTaken: number, founderSpots: number): number {
  return Math.max(0, founderSpots - foundersTaken);
}

export function monthlyPriceCents(tier: PriceTier, cfg: PricingConfig): number {
  return tier === "founder" ? cfg.founderMonthlyCents : cfg.standardMonthlyCents;
}

/** Valor cobrado por ciclo (mensal: por mês; anual: o ano inteiro). O anual é o mesmo para as duas faixas. */
export function cyclePriceCents(tier: PriceTier, cycle: BillingCycle, cfg: PricingConfig): number {
  return cycle === "annual" ? cfg.annualCents : monthlyPriceCents(tier, cfg);
}

/** Quanto o anual economiza em relação a 12 meses na faixa da oficina (0 se não economiza). */
export function annualSavingsCents(tier: PriceTier, cfg: PricingConfig): number {
  return Math.max(0, monthlyPriceCents(tier, cfg) * 12 - cfg.annualCents);
}

/** Máximo de parcelas do anual no cartão: a AbacatePay exige parcela de pelo menos R$ 10 e aceita até 12x. */
export function annualInstallments(cfg: PricingConfig): number {
  return Math.max(1, Math.min(12, cfg.annualMaxInstallments, Math.floor(cfg.annualCents / 1000)));
}

/** Fim do acesso depois de pagar o anual: 12 meses a partir de hoje ou do fim do período ainda pago. */
export function annualPeriodEnd(paidAt: Date, currentEnd: Date | null | undefined): Date {
  const base = currentEnd && currentEnd.getTime() > paidAt.getTime() ? currentEnd : paidAt;
  const d = new Date(base);
  d.setFullYear(d.getFullYear() + 1);
  return d;
}

/** O plano anual ativo já pode ser renovado (faltam `windowDays` dias ou menos)? */
export function annualRenewalOpen(sub: { billingCycle?: string | null; currentPeriodEnd?: Date | null } | null | undefined, windowDays: number, now = new Date()): boolean {
  if (!sub || sub.billingCycle !== "annual" || !sub.currentPeriodEnd) return false;
  return sub.currentPeriodEnd.getTime() - now.getTime() <= windowDays * 86_400_000;
}

/** externalId do produto na AbacatePay. Os mensais de R$ 35 mantêm os ids antigos (produtos já criados). */
export function productExternalId(i: { cycle: BillingCycle; cents: number; trial: boolean }): string {
  if (i.cycle === "annual") return `carretel-anual-${i.cents}`;
  const base = i.cents === 3500 ? "carretel-mensal" : `carretel-mensal-${i.cents}`;
  return i.trial ? `${base}-teste-cartao` : base;
}
