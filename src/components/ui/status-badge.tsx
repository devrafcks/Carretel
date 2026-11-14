import { CircleCheck, Clock, RotateCcw, Scale, Scissors, TriangleAlert, Package, Ban, CircleDot, Archive, Truck } from "@/components/icons";
import { cn } from "@/lib/utils";

export type DomainTone = "paid" | "in-production" | "awaiting-confirmation" | "overdue-calote" | "rework" | "clt-warning" | "neutral";

const toneClass: Record<DomainTone, string> = {
  paid: "bg-paid-bg text-paid-fg border-paid-border",
  "in-production": "bg-in-production-bg text-in-production-fg border-in-production-border",
  "awaiting-confirmation": "bg-awaiting-confirmation-bg text-awaiting-confirmation-fg border-awaiting-confirmation-border",
  "overdue-calote": "bg-overdue-calote-bg text-overdue-calote-fg border-overdue-calote-border",
  rework: "bg-rework-bg text-rework-fg border-rework-border",
  "clt-warning": "bg-clt-warning-bg text-clt-warning-fg border-clt-warning-border",
  neutral: "bg-muted text-foreground border-border",
};

const toneIcon = {
  paid: CircleCheck,
  "in-production": Scissors,
  "awaiting-confirmation": Clock,
  "overdue-calote": TriangleAlert,
  rework: RotateCcw,
  "clt-warning": Scale,
  neutral: CircleDot,
} as const;

/** Status SEMPRE com ícone + texto (nunca só cor). */
export function StatusBadge({ tone, label, icon, className }: { tone: DomainTone; label: string; icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>; className?: string }) {
  const Icon = icon ?? toneIcon[tone];
  return (
    <span className={cn("inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-0.5 text-sm font-medium leading-tight", toneClass[tone], className)}>
      <Icon aria-hidden={true} className="size-4" />
      {label}
    </span>
  );
}

export const batchTone: Record<string, { tone: DomainTone; icon?: typeof Package }> = {
  received: { tone: "neutral", icon: Package },
  in_production: { tone: "in-production" },
  ready: { tone: "in-production", icon: Truck },
  delivered: { tone: "awaiting-confirmation", icon: Truck },
  closed: { tone: "paid", icon: Archive },
  canceled: { tone: "neutral", icon: Ban },
};

export const receivableTone: Record<string, { tone: DomainTone }> = {
  awaiting_confirmation: { tone: "awaiting-confirmation" },
  open: { tone: "in-production" },
  disputed: { tone: "rework" },
  partially_paid: { tone: "in-production" },
  paid: { tone: "paid" },
  written_off: { tone: "neutral" },
};
