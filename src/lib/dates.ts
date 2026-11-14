/** Persistência em UTC, exibição em America/Sao_Paulo. */
export const TZ = "America/Sao_Paulo";

/** Data de hoje (YYYY-MM-DD) no fuso de São Paulo. */
export function todayISO(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Date à meia-noite UTC representando o dia de hoje em SP (cálculos de calendário). */
export function todayUTCDate(now = new Date()): Date {
  const [y, m, d] = todayISO(now).split("-").map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
}

export function daysBetween(fromISO: string, toISO: string): number {
  const a = Date.parse(fromISO + "T00:00:00Z");
  const b = Date.parse(toISO + "T00:00:00Z");
  return Math.round((b - a) / 86_400_000);
}

export function addDaysISO(iso: string, days: number): string {
  return new Date(Date.parse(iso + "T00:00:00Z") + days * 86_400_000).toISOString().slice(0, 10);
}

function toDate(v: string | Date): Date {
  if (v instanceof Date) return v;
  return new Date(v.length === 10 ? v + "T12:00:00Z" : v);
}

export function formatDate(v: string | Date, locale: string, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat(locale, { timeZone: TZ, day: "2-digit", month: "2-digit", ...opts }).format(toDate(v));
}

export function formatDateTime(d: Date, locale: string): { date: string; time: string } {
  return {
    date: new Intl.DateTimeFormat(locale, { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" }).format(d),
    time: new Intl.DateTimeFormat(locale, { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(d),
  };
}

export type AgingBucket = "ok" | "watch" | "late" | "critical";
/** 0–7 ok · 8–15 watch · 16–30 late · 30+ critical (usa o token late) */
export function agingBucket(days: number): AgingBucket {
  if (days <= 7) return "ok";
  if (days <= 15) return "watch";
  if (days <= 30) return "late";
  return "critical";
}
