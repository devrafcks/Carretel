/**
 * Grupo A — decisões de produto (seção 1.3 do prompt).
 * Nome escolhido em 14/11/2026: "Carretel" (sem verificação de INPI nem de domínio — A1).
 */
export type Weekday = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface BrandConfig {
  brandName: string;
  shortName: string;
  tagline: { es: string; "pt-BR": string };
  domain: string;
  defaultLocale: "es" | "pt-BR";
  esTreatment: "usted" | "tú";
  freeBatchLimit: number;
  freeDaysLimit: number;
  cardTrialDays: number;
  settlementDay: Weekday;
  accountDeletionDays: number;
  readOnlyAllowsMarkPaid: boolean;
  showMadeWithFooter: boolean;
  publicCalculator: boolean;
  photoStorage: "vercel-blob" | "r2" | "local";
  pricing: PricingConfig;
}

/**
 * Preços em centavos. As regras ficam em src/lib/pricing.ts:
 * - fundador: as primeiras `founderSpots` oficinas que pagam ficam com `founderMonthlyCents` enquanto a assinatura estiver ativa;
 * - depois disso, assinaturas novas (e quem cancelou e voltou) pagam `standardMonthlyCents`;
 * - anual: pagamento único de 12 mensalidades da faixa com `annualDiscountPct`% de desconto
 *   (Pix ou cartão em até `annualMaxInstallments`x).
 */
export interface PricingConfig {
  founderMonthlyCents: number;
  founderSpots: number;
  standardMonthlyCents: number;
  /** desconto do anual sobre 12 mensalidades da faixa (20 = 20%) */
  annualDiscountPct: number;
  annualMaxInstallments: number;
  /** Quantos dias antes do fim do plano anual a renovação fica liberada. */
  annualRenewWindowDays: number;
}

export const brand: BrandConfig = {
  brandName: process.env.NEXT_PUBLIC_BRAND_NAME || "Carretel",
  shortName: "Carretel",
  tagline: {
    es: "Registra, Comprueba y Cobra",
    "pt-BR": "Registra, Comprova e Cobra",
  },
  domain: process.env.NEXT_PUBLIC_APP_URL || "",
  defaultLocale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE === "pt-BR" ? "pt-BR" : "es",
  esTreatment: "usted",
  freeBatchLimit: 3,
  freeDaysLimit: 30,
  cardTrialDays: 7,
  settlementDay: "saturday",
  accountDeletionDays: 30,
  readOnlyAllowsMarkPaid: true,
  showMadeWithFooter: true,
  publicCalculator: false, // calculadora exige conta (pedido do responsável em 14/11/2026)
  photoStorage: process.env.BLOB_READ_WRITE_TOKEN ? "vercel-blob" : "local",
  pricing: {
    founderMonthlyCents: 3500,
    founderSpots: 10,
    standardMonthlyCents: 6999,
    annualDiscountPct: 20,
    annualMaxInstallments: 12,
    annualRenewWindowDays: 30,
  },
};

/**
 * Endereço público do app, sempre só o domínio (protocolo + host).
 * Tolera variável configurada com caminho ou barra no fim (ex.: "https://x.app/pt-BR/") — o idioma é somado pelo app.
 */
export function appUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim();
  try {
    return new URL(raw).origin;
  } catch {
    return raw.replace(/\/+$/, "");
  }
}
