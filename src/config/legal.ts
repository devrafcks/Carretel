/**
 * Grupo B — dados legais do SaaS (Decreto 7.962/2013, LGPD, Marco Civil).
 * NUNCA inventar estes dados. Campos vazios aparecem como "—" na UI,
 * geram aviso no build e um item na página interna /[locale]/go-live.
 */
export interface LegalConfig {
  companyName: string;
  cnpj: string;
  address: string;
  supportEmail: string;
  supportSlaDays: number;
  supportWhatsapp: string;
  dpoName: string;
  dpoEmail: string;
  taxRegime: string;
  forumCity: string;
  abuseReportChannel: string;
  accessLogRetentionMonths: number;
  purgeMarginDays: number;
  /** Versões vigentes dos documentos (legal_documents.version) */
  documentVersions: { terms: string; privacy: string; no_forced_labor: string; dpa: string };
}

export const legal: LegalConfig = {
  companyName: "", // TODO B1
  cnpj: "", // TODO B2 (CNPJ do SaaS, não do taller)
  address: "", // TODO B3
  supportEmail: "", // TODO B4
  supportSlaDays: 5,
  supportWhatsapp: "", // B5 opcional
  dpoName: "", // TODO B6
  dpoEmail: "", // TODO B6
  taxRegime: "", // TODO B7 (com o contador)
  forumCity: "", // TODO B8
  abuseReportChannel: "", // B9 → cai em supportEmail
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

export function abuseChannel(): string {
  return legal.abuseReportChannel || legal.supportEmail;
}

/** Itens do Grupo B ainda vazios (para o checklist de go-live e o aviso de build). */
export function missingLegalFields(): string[] {
  const required: Array<[keyof LegalConfig, string]> = [
    ["companyName", "B1 razão social / nome empresarial"],
    ["cnpj", "B2 CNPJ do SaaS"],
    ["address", "B3 endereço"],
    ["supportEmail", "B4 e-mail de suporte"],
    ["dpoName", "B6 encarregado LGPD (nome)"],
    ["dpoEmail", "B6 encarregado LGPD (e-mail)"],
    ["taxRegime", "B7 regime tributário"],
    ["forumCity", "B8 foro"],
  ];
  return required.filter(([k]) => String(legal[k]).trim() === "").map(([, label]) => label);
}
