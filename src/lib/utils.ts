import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1]![0] : "")).toUpperCase() || "?";
}

export function waLink(phoneE164: string | null | undefined, text: string): string {
  const digits = (phoneE164 ?? "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

const SIZE_ORDER = ["RN", "PP", "XP", "P", "M", "G", "GG", "XG", "XGG", "EG", "EGG", "U", "UN", "ÚNICO", "UNICO"];
/** Ordena a grade como na ficha (PP, P, M, G, GG…; números em ordem crescente). */
export function sortSizes(grid: Record<string, number>): [string, number][] {
  const rank = (k: string) => {
    const i = SIZE_ORDER.indexOf(k.toUpperCase());
    if (i >= 0) return i;
    const n = Number(k);
    return Number.isFinite(n) ? 100 + n : 1000;
  };
  return Object.entries(grid).sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b));
}
