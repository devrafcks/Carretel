import { describe, expect, it } from "vitest";
import {
  annualInstallments,
  annualPeriodEnd,
  annualRenewalOpen,
  annualSavingsCents,
  choosePriceTier,
  cyclePriceCents,
  foundersLeft,
  hasPaidHistory,
  productExternalId,
  type PriceTier,
} from "@/lib/pricing";
import { brand, type PricingConfig } from "@/config/brand";

const cfg: PricingConfig = { founderMonthlyCents: 3500, founderSpots: 10, standardMonthlyCents: 6999, annualDiscountPct: 20, annualMaxInstallments: 12, annualRenewWindowDays: 30 };

describe("faixa de preço (fundador x padrão)", () => {
  it("as 10 primeiras oficinas pagantes são fundadoras; a 11ª já é padrão", () => {
    const tiers: PriceTier[] = [];
    let taken = 0;
    for (let i = 0; i < 12; i++) {
      const tier = choosePriceTier({ lockedTier: null, activeNow: false, hasHistory: false, foundersTaken: taken, founderSpots: cfg.founderSpots });
      tiers.push(tier);
      if (tier === "founder") taken++;
    }
    expect(tiers.slice(0, 10).every((t) => t === "founder")).toBe(true);
    expect(tiers[10]).toBe("standard");
    expect(tiers[11]).toBe("standard");
  });

  it("fundador com a assinatura ativa renova a R$ 35, mesmo com as vagas esgotadas", () => {
    expect(choosePriceTier({ lockedTier: "founder", activeNow: true, hasHistory: true, foundersTaken: 10, founderSpots: 10 })).toBe("founder");
    expect(choosePriceTier({ lockedTier: "founder", activeNow: true, hasHistory: true, foundersTaken: 50, founderSpots: 10 })).toBe("founder");
  });

  it("fundador que cancelou e volta paga o preço vigente, mesmo com vagas sobrando", () => {
    expect(choosePriceTier({ lockedTier: "founder", activeNow: false, hasHistory: true, foundersTaken: 10, founderSpots: 10 })).toBe("standard");
    expect(choosePriceTier({ lockedTier: "founder", activeNow: false, hasHistory: true, foundersTaken: 2, founderSpots: 10 })).toBe("standard");
  });

  it("quem entrou no padrão continua no padrão, mesmo que sobrem vagas", () => {
    expect(choosePriceTier({ lockedTier: "standard", activeNow: true, hasHistory: true, foundersTaken: 3, founderSpots: 10 })).toBe("standard");
    expect(choosePriceTier({ lockedTier: "standard", activeNow: false, hasHistory: true, foundersTaken: 3, founderSpots: 10 })).toBe("standard");
  });

  it("checkout abandonado não trava a faixa nem ocupa vaga", () => {
    // gravou "founder" ao abrir o checkout, não pagou e as vagas acabaram nesse meio-tempo
    expect(choosePriceTier({ lockedTier: "founder", activeNow: false, hasHistory: false, foundersTaken: 10, founderSpots: 10 })).toBe("standard");
    // e quem abandonou com "standard" ganha a vaga de fundador se ela ainda existir
    expect(choosePriceTier({ lockedTier: "standard", activeNow: false, hasHistory: false, foundersTaken: 9, founderSpots: 10 })).toBe("founder");
  });

  it("histórico = teste iniciado, primeira cobrança ou assinatura na AbacatePay", () => {
    expect(hasPaidHistory(null)).toBe(false);
    expect(hasPaidHistory({})).toBe(false);
    expect(hasPaidHistory({ trialEndsAt: new Date() })).toBe(true);
    expect(hasPaidHistory({ firstChargedAt: new Date() })).toBe(true);
    expect(hasPaidHistory({ abacateSubscriptionId: "subs_x" })).toBe(true);
  });

  it("vagas restantes nunca ficam negativas", () => {
    expect(foundersLeft(0, 10)).toBe(10);
    expect(foundersLeft(7, 10)).toBe(3);
    expect(foundersLeft(12, 10)).toBe(0);
  });
});

describe("preços por ciclo", () => {
  it("mensal e anual dependem da faixa; anual = 12 mensalidades com 20% de desconto", () => {
    expect(cyclePriceCents("founder", "monthly", cfg)).toBe(3500);
    expect(cyclePriceCents("standard", "monthly", cfg)).toBe(6999);
    expect(cyclePriceCents("founder", "annual", cfg)).toBe(33600);
    expect(cyclePriceCents("standard", "annual", cfg)).toBe(67190);
  });

  it("economia do anual é calculada contra 12 mensalidades da faixa", () => {
    expect(annualSavingsCents("founder", cfg)).toBe(42000 - 33600);
    expect(annualSavingsCents("standard", cfg)).toBe(83988 - 67190);
    expect(annualSavingsCents("founder", { ...cfg, annualDiscountPct: 0 })).toBe(0);
  });

  it("parcelas do anual respeitam o mínimo de R$ 10 por parcela e o teto de 12", () => {
    expect(annualInstallments(67190, cfg)).toBe(12);
    expect(annualInstallments(5000, cfg)).toBe(5);
    expect(annualInstallments(67190, { ...cfg, annualMaxInstallments: 6 })).toBe(6);
    expect(annualInstallments(500, cfg)).toBe(1);
  });

  it("o config do app segue a regra combinada", () => {
    expect(brand.pricing.founderMonthlyCents).toBe(3500);
    expect(brand.pricing.founderSpots).toBe(10);
    expect(brand.pricing.standardMonthlyCents).toBe(6999);
    expect(brand.pricing.annualDiscountPct).toBe(20);
  });
});

describe("plano anual", () => {
  it("12 meses a partir do pagamento, ou somados ao período que ainda resta", () => {
    const paid = new Date("2026-11-14T12:00:00Z");
    expect(annualPeriodEnd(paid, null).toISOString()).toBe("2027-11-14T12:00:00.000Z");
    expect(annualPeriodEnd(paid, new Date("2026-12-01T00:00:00Z")).toISOString()).toBe("2027-12-01T00:00:00.000Z");
    // período já vencido não soma
    expect(annualPeriodEnd(paid, new Date("2026-10-01T00:00:00Z")).toISOString()).toBe("2027-11-14T12:00:00.000Z");
  });

  it("renovação abre só nos últimos 30 dias do anual", () => {
    const now = new Date("2026-11-14T00:00:00Z");
    expect(annualRenewalOpen({ billingCycle: "annual", currentPeriodEnd: new Date("2026-12-01T00:00:00Z") }, 30, now)).toBe(true);
    expect(annualRenewalOpen({ billingCycle: "annual", currentPeriodEnd: new Date("2027-06-01T00:00:00Z") }, 30, now)).toBe(false);
    expect(annualRenewalOpen({ billingCycle: "monthly", currentPeriodEnd: new Date("2026-11-20T00:00:00Z") }, 30, now)).toBe(false);
  });

  it("ids dos produtos: os de R$ 35 mantêm os nomes antigos", () => {
    expect(productExternalId({ cycle: "monthly", cents: 3500, trial: false })).toBe("carretel-mensal");
    expect(productExternalId({ cycle: "monthly", cents: 3500, trial: true })).toBe("carretel-mensal-teste-cartao");
    expect(productExternalId({ cycle: "monthly", cents: 4900, trial: false })).toBe("carretel-mensal-4900");
    expect(productExternalId({ cycle: "monthly", cents: 4900, trial: true })).toBe("carretel-mensal-4900-teste-cartao");
    expect(productExternalId({ cycle: "monthly", cents: 6999, trial: false })).toBe("carretel-mensal-6999");
    expect(productExternalId({ cycle: "annual", cents: 67190, trial: false })).toBe("carretel-anual-67190");
  });
});
