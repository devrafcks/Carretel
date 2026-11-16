/**
 * Grupo B — dados legais do SaaS (Decreto 7.962/2013, LGPD, Marco Civil).
 * NUNCA inventar estes dados. Só ficam aqui os que existem: o contato de atendimento também é o
 * canal do encarregado de dados (LGPD) e de denúncias. CNPJ vazio gera aviso no build e no /go-live.
 */
export interface LegalConfig {
  cnpj: string;
  supportEmail: string;
  supportSlaDays: number;
  accessLogRetentionMonths: number;
  purgeMarginDays: number;
  /** Versões vigentes dos documentos (legal_documents.version) */
  documentVersions: { terms: string; privacy: string; no_forced_labor: string; dpa: string };
}

export const legal: LegalConfig = {
  cnpj: "65.605.980/0001-00", // CNPJ do SaaS, informado pelo responsável em 14/11/2026
  supportEmail: "rafcksps@gmail.com", // e-mail de atendimento (pedido do responsável em 14/11/2026)
  supportSlaDays: 5,
  accessLogRetentionMonths: 6,
  purgeMarginDays: 30,
  documentVersions: {
    terms: "2026-11-14-draft",
    privacy: "2026-11-14-draft",
    no_forced_labor: "2026-11-14-draft",
    dpa: "2026-11-14-draft",
  },
};

export const LEGAL_PLACEHOLDER = "—";

export function legalValue(v: string): string {
  return v.trim() === "" ? LEGAL_PLACEHOLDER : v;
}

/** Contato do encarregado de dados (LGPD): o e-mail de atendimento. */
export function dpoContact(): string {
  return legal.supportEmail;
}

export function abuseChannel(): string {
  return legal.supportEmail;
}

/** Itens do Grupo B ainda vazios (para o checklist de go-live e o aviso de build). */
export function missingLegalFields(): string[] {
  const required: Array<[keyof LegalConfig, string]> = [["cnpj", "CNPJ do SaaS"]];
  return required.filter(([k]) => String(legal[k]).trim() === "").map(([, label]) => label);
}
