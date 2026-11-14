import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

/** Todo valor em R$ com .tabular-money. */
export function Money({ cents, locale, className }: { cents: number; locale: string; className?: string }) {
  return <span className={cn("tabular-money whitespace-nowrap", className)}>{formatBRL(cents, locale)}</span>;
}
