/**
 * Peças do registro de erros usadas no servidor e no navegador (sem dependências de Node):
 * código curto que a pessoa vê, limpeza de segredos antes de gravar, agrupamento e o e-mail de suporte já preenchido.
 */
import { legal } from "@/config/legal";

export const SUPPORT_EMAIL = legal.supportEmail;

/** Sem 0/O, 1/I/L: dá para ler em voz alta ou digitar sem confundir. */
const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Código do erro, ex.: "K7M2QX". Quem vê na tela manda no pedido de suporte; o admin busca por ele. */
export function newErrorRef(): string {
  const bytes = new Uint8Array(6);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => REF_ALPHABET[b % REF_ALPHABET.length]).join("");
}

/** Erro de servidor do React chega ao navegador só com o digest (número): vira o código mostrado. */
export function refFromDigest(digest: string | undefined | null): string | null {
  const d = (digest ?? "").trim();
  return /^[A-Za-z0-9-]{4,64}$/.test(d) ? d : null;
}

const SCRUBBERS: [RegExp, string][] = [
  [/\b(abc_(?:prod|dev)_[A-Za-z0-9]+)/g, "[chave-abacatepay]"],
  [/\b(sbp_|sb_secret_|sb_publishable_)[A-Za-z0-9_-]+/g, "[chave-supabase]"],
  [/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [oculto]"],
  [/(postgres(?:ql)?:\/\/)[^@\s/]+@/gi, "$1[oculto]@"],
  [/\b(password|senha|contrase(?:ñ|n)a|secret|token|api[_-]?key|authorization|cookie|otp|code)(["']?\s*[:=]\s*["']?)[^\s"',;}&]+/gi, "$1$2[oculto]"],
  [/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[cpf]"],
  [/\b[0-9a-f]{40,}\b/gi, "[hash]"],
  [/\b[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{10,}\b/g, "[jwt]"],
];

/** Tira segredos e documentos de um texto de erro e corta no tamanho. E-mail fica parcial (r***@gmail.com). */
export function scrub(text: string | null | undefined, max = 2000): string | null {
  if (text == null) return null;
  let s = String(text);
  for (const [re, to] of SCRUBBERS) s = s.replace(re, to);
  s = s.replace(/\b([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g, "$1***@$2");
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

/** Agrupa o "mesmo erro": tira números, ids e códigos variáveis da mensagem antes de calcular. */
export function errorFingerprint(event: string, message: string | null | undefined): string {
  const norm = `${event}|${(message ?? "")
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "<id>")
    .replace(/\b(bill|subs|cust|prod|log)_[A-Za-z0-9]+/g, "$1_<id>")
    .replace(/\d+/g, "<n>")
    .slice(0, 300)}`;
  // FNV-1a 32 bits (duas passadas com sementes diferentes = 64 bits): estável e sem crypto
  let a = 0x811c9dc5;
  let b = 0x01000193 ^ 0x5bd1e995;
  for (let i = 0; i < norm.length; i++) {
    const c = norm.charCodeAt(i);
    a = Math.imul(a ^ c, 0x01000193) >>> 0;
    b = Math.imul(b ^ c, 0x01000193 ^ 0x2545f491) >>> 0;
  }
  return a.toString(16).padStart(8, "0") + b.toString(16).padStart(8, "0");
}

export type SupportLocale = "es" | "pt-BR";

export function supportLocale(value: string | null | undefined): SupportLocale {
  return value === "pt-BR" || value?.startsWith("/pt-BR") ? "pt-BR" : "es";
}

const COPY = {
  "pt-BR": {
    subject: (ref: string | null) => `Carretel: pedido de ajuda${ref ? ` (erro ${ref})` : ""}`,
    body: (o: { ref: string | null; page: string; when: string; device: string }) =>
      [
        "Olá! Tive um problema no Carretel.",
        "",
        "O que eu estava fazendo (conte com suas palavras):",
        "",
        "",
        "---- não apague daqui para baixo, ajuda a achar o problema ----",
        o.ref ? `Código do erro: ${o.ref}` : null,
        `Página: ${o.page}`,
        `Quando: ${o.when}`,
        `Aparelho: ${o.device}`,
      ]
        .filter((l) => l !== null)
        .join("\n"),
  },
  es: {
    subject: (ref: string | null) => `Carretel: pedido de ayuda${ref ? ` (error ${ref})` : ""}`,
    body: (o: { ref: string | null; page: string; when: string; device: string }) =>
      [
        "¡Hola! Tuve un problema en Carretel.",
        "",
        "Qué estaba haciendo (cuéntalo con tus palabras):",
        "",
        "",
        "---- no borres desde aquí, ayuda a encontrar el problema ----",
        o.ref ? `Código del error: ${o.ref}` : null,
        `Página: ${o.page}`,
        `Cuándo: ${o.when}`,
        `Dispositivo: ${o.device}`,
      ]
        .filter((l) => l !== null)
        .join("\n"),
  },
} as const;

/** Resumo do aparelho para o e-mail (sem o user agent inteiro). */
export function deviceSummary(ua: string): string {
  const os = /Android/i.test(ua) ? "Android" : /iPhone|iPad|iOS/i.test(ua) ? "iPhone/iPad" : /Windows/i.test(ua) ? "Windows" : /Mac OS/i.test(ua) ? "Mac" : /Linux/i.test(ua) ? "Linux" : "outro";
  const br = /Edg\//.test(ua) ? "Edge" : /SamsungBrowser/.test(ua) ? "Samsung Internet" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "navegador";
  return `${os} · ${br}`;
}

/** Link mailto: já com assunto e um texto pronto (código, página, hora e aparelho). */
export function supportMailto(o: { ref: string | null; locale: SupportLocale; page: string; when?: Date; device?: string }): string {
  const c = COPY[o.locale];
  const when = (o.when ?? new Date()).toLocaleString(o.locale === "pt-BR" ? "pt-BR" : "es-BO", { dateStyle: "short", timeStyle: "medium" });
  const subject = c.subject(o.ref);
  const body = c.body({ ref: o.ref, page: o.page, when, device: o.device ?? "—" });
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
