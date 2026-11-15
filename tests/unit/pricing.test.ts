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

const cfg: PricingConfig = { founderMonthlyCents: 3500, founderSpots: 10, standardMonthlyCents: 4900, annualCents: 39000, annualMaxInstallments: 12, annualRenewWindowDays: 30 };

describe("faixa de preço (fundador x padrão)", () => {
  it("as 10 primeiras oficinas pagantes são fundadoras; a 11ª já é padrão", () => {
    const tiers: PriceTier[] = [];
    let taken = 0;
    for (let i = 0; i < 12; i++) {
      const tier = choosePriceTier({ lockedTier: null, hasHistory: false, foundersTaken: taken, founderSpots: cfg.founderSpots });
      tiers.push(tier);
      if (tier === "founder") taken++;
    }
    expect(tiers.slice(0, 10).every((t) => t === "founder")).toBe(true);
    expect(tiers[10]).toBe("standard");
    expect(tiers[11]).toBe("standard");
  });

  it("fundador que cancela e volta continua com R$ 35, mesmo com as vagas esgotadas", () => {
    expect(choosePriceTier({ lockedTier: "founder", hasHistory: true, foundersTaken: 10, founderSpots: 10 })).toBe("founder");
    expect(choosePriceTier({ lockedTier: "founder", hasHistory: true, foundersTaken: 50, founderSpots: 10 })).toBe("founder");
  });

  it("quem entrou no padrão continua no padrão, mesmo que sobrem vagas", () => {
    expect(choosePriceTier({ lockedTier: "standard", hasHistory: true, foundersTaken: 3, founderSpots: 10 })).toBe("standard");
  });

  it("checkout abandonado não trava a faixa nem ocupa vaga", () => {
    // gravou "founder" ao abrir o checkout, não pagou e as vagas acabaram nesse meio-tempo
    expect(choosePriceTier({ lockedTier: "founder", hasHistory: false, foundersTaken: 10, founderSpots: 10 })).toBe("standard");
    // e quem abandonou com "standard" ganha a vaga de fundador se ela ainda existir
    expect(choosePriceTier({ lockedTier: "standard", hasHistory: false, foundersTaken: 9, founderSpots: 10 })).toBe("founder");
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
  it("mensal depende da faixa; anual é o mesmo para todos", () => {
    expect(cyclePriceCents("founder", "monthly", cfg)).toBe(3500);
    expect(cyclePriceCents("standard", "monthly", cfg)).toBe(4900);
    expect(cyclePriceCents("founder", "annual", cfg)).toBe(39000);
    expect(cyclePriceCents("standard", "annual", cfg)).toBe(39000);
  });

  it("economia do anual é calculada contra 12 mensalidades da faixa", () => {
    expect(annualSavingsCents("founder", cfg)).toBe(42000 - 39000);
    expect(annualSavingsCents("standard", cfg)).toBe(58800 - 39000);
    expect(annualSavingsCents("founder", { ...cfg, annualCents: 50000 })).toBe(0);
  });

  it("parcelas do anual respeitam o mínimo de R$ 10 por parcela e o teto de 12", () => {
    expect(annualInstallments(cfg)).toBe(12);
    expect(annualInstallments({ ...cfg, annualCents: 5000 })).toBe(5);
    expect(annualInstallments({ ...cfg, annualMaxInstallments: 6 })).toBe(6);
    expect(annualInstallments({ ...cfg, annualCents: 500 })).toBe(1);
  });

  it("o config do app segue a regra combinada", () => {
    expect(brand.pricing.founderMonthlyCents).toBe(3500);
    expect(brand.pricing.founderSpots).toBe(10);
    expect(brand.pricing.standardMonthlyCents).toBe(4900);
    expect(brand.pricing.annualCents).toBe(39000);
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
    expect(productExternalId({ cycle: "annual", cents: 39000, trial: false })).toBe("carretel-anual-39000");
  });
});
