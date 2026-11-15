import { cn } from "@/lib/utils";

/** Duas séries por mês (ex.: faturado x recebido), barras finas lado a lado. */
export function PairBars({
  data,
  labels,
  format,
  label,
  className,
}: {
  data: { key: string; label: string; a: number; b: number }[];
  labels: { a: string; b: string };
  format: (v: number) => string;
  label: string;
  className?: string;
}) {
  const max = Math.max(1, ...data.flatMap((d) => [d.a, d.b]));
  return (
    <figure className={className}>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-ink/20" aria-hidden="true" />
          {labels.a}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-vivid" aria-hidden="true" />
          {labels.b}
        </span>
      </div>
      <div role="img" aria-label={label} className="mt-4 flex h-44 items-end gap-2 sm:gap-4">
        {data.map((d) => (
          <div key={d.key} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
            <div className="flex h-full w-full items-end justify-center gap-1">
              <span title={`${labels.a}: ${format(d.a)}`} className="anim-bar block w-2.5 rounded-full bg-ink/20 sm:w-3" style={{ height: `${Math.max(2, (d.a / max) * 100)}%` }} />
              <span title={`${labels.b}: ${format(d.b)}`} className="anim-bar block w-2.5 rounded-full bg-vivid sm:w-3" style={{ height: `${Math.max(2, (d.b / max) * 100)}%` }} />
            </div>
            <span className="text-[0.6875rem] text-muted-foreground">{d.label}</span>
          </div>
        ))}
      </div>
      {/* a mesma informação em texto, para leitor de tela */}
      <figcaption className="sr-only">
        {data.map((d) => `${d.label}: ${labels.a} ${format(d.a)}, ${labels.b} ${format(d.b)}`).join("; ")}
      </figcaption>
    </figure>
  );
}

/** Lista com barra horizontal (ranking). */
export function HBars({ items, className }: { items: { key: string; label: string; value: number; display: string; hint?: string; tone?: "vivid" | "ink" | "warn" }[]; className?: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className={cn("space-y-3.5", className)}>
      {items.map((i) => (
        <li key={i.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium">{i.label}</span>
            <span className="shrink-0 tabular-money">{i.display}</span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-mint-50">
            <div
              className={cn("anim-grow-x h-full rounded-full", i.tone === "warn" ? "bg-overdue-calote-fg/70" : i.tone === "ink" ? "bg-ink/40" : "bg-vivid")}
              style={{ width: `${Math.max(3, (i.value / max) * 100)}%` }}
            />
          </div>
          {i.hint ? <p className="mt-1 text-xs text-muted-foreground">{i.hint}</p> : null}
        </li>
      ))}
    </ul>
  );
}
