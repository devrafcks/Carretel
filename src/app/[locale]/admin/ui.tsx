import { cn } from "@/lib/utils";

const LABEL: Record<string, string> = {
  free: "Grátis",
  pending_checkout: "Aguardando pgto",
  trialing: "Teste",
  active: "Ativo",
  past_due: "Pgto pendente",
  canceled: "Cancelado",
  read_only: "Somente leitura",
  none: "Sem taller",
};
const TONE: Record<string, string> = {
  active: "bg-mint-100 text-vivid-strong",
  trialing: "bg-mint-100 text-vivid-strong",
  past_due: "bg-overdue-calote-bg text-overdue-calote-fg",
  read_only: "bg-overdue-calote-bg text-overdue-calote-fg",
  pending_checkout: "bg-awaiting-confirmation-bg text-awaiting-confirmation-fg",
};

export function PlanPill({ status }: { status: string }) {
  return <span className={cn("inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", TONE[status] ?? "bg-ink/[0.06] text-foreground")}>{LABEL[status] ?? status}</span>;
}

/** Faixa de preço e ciclo da assinatura (fundador R$ 35, padrão R$ 49, anual). */
export function TierPill({ tier, cycle }: { tier: string | null; cycle?: string | null }) {
  if (!tier) return <span className="text-muted-foreground">—</span>;
  const label = (tier === "founder" ? "Fundador" : "Padrão") + (cycle === "annual" ? " · anual" : "");
  return <span className={cn("inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", tier === "founder" ? "bg-sun/40 text-ink" : "bg-ink/[0.06] text-foreground")}>{label}</span>;
}

export function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1).replace(".", ",")} MB`;
  return `${(n / 1024 ** 3).toFixed(2).replace(".", ",")} GB`;
}
