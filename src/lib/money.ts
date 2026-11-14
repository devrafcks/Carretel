/** Dinheiro sempre em centavos inteiros. Formatação só na borda. */
export type Cents = number;

export function assertCents(v: number): Cents {
  if (!Number.isSafeInteger(v)) throw new Error(`valor em centavos inválido: ${v}`);
  return v;
}

const formatters = new Map<string, Intl.NumberFormat>();
export function formatBRL(cents: Cents, locale: string = "pt-BR"): string {
  const key = locale;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale === "es" ? "es-BO" : "pt-BR", { style: "currency", currency: "BRL" });
    formatters.set(key, f);
  }
  // Normaliza para "R$" (alguns ICUs em es usam "BRL")
  return f.format(cents / 100).replace(/BRL\s?/, "R$ ").replace(/\u00a0/g, " ");
}

/** "2,50" | "2.50" | "R$ 1.234,56" | "1234" → centavos. null se inválido. */
export function parseMoneyInput(raw: string): Cents | null {
  const s = raw.replace(/R\$|\s|\u00a0/g, "").trim();
  if (s === "") return null;
  if (!/^-?[\d.,]+$/.test(s)) return null;
  let normalized: string;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > -1 && lastComma > lastDot) {
    normalized = s.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > -1 && lastComma > -1) {
    normalized = s.replace(/,/g, "");
  } else if (lastDot > -1) {
    const decimals = s.length - lastDot - 1;
    normalized = decimals === 3 && s.split(".").length >= 2 ? s.replace(/\./g, "") : s;
  } else {
    normalized = s;
  }
  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

export function centsToInput(cents: Cents): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function sumCents(values: Cents[]): Cents {
  return values.reduce((a, b) => a + b, 0);
}

/** Multiplica centavos por quantidade inteira sem perder precisão. */
export function mulCents(cents: Cents, qty: number): Cents {
  return assertCents(Math.round(cents * qty));
}
