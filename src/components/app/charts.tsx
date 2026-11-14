import { cn } from "@/lib/utils";

/** Barras finas (estilo das referências): uma barra por dia; a última destacada. Decorativo + rótulo acessível. */
export function ThinBars({ values, label, className }: { values: number[]; label: string; className?: string }) {
  const max = Math.max(1, ...values);
  return (
    <div role="img" aria-label={label} className={cn("flex h-28 items-end gap-1", className)}>
      {values.map((v, i) => {
        const h = v === 0 ? 4 : Math.max(8, Math.round((v / max) * 100));
        const last = i === values.length - 1;
        return (
          <span key={i} className="flex h-full flex-1 items-end justify-center">
            <span
              className={cn("anim-bar block w-1.5 rounded-full sm:w-2", last ? "bg-vivid" : v === 0 ? "bg-ink/10" : "bg-ink/25")}
              style={{ height: `${h}%`, animationDelay: `${i * 30}ms` }}
            />
          </span>
        );
      })}
    </div>
  );
}

/** Barra de progresso dividida (ex.: recebido x em aberto). */
export function SplitBar({ pct, className }: { pct: number; className?: string }) {
  return (
    <div aria-hidden="true" className={cn("flex h-3 w-full overflow-hidden rounded-full bg-mint-100", className)}>
      <span className="anim-grow-x block h-full rounded-full bg-vivid" style={{ width: `${Math.max(2, Math.min(100, pct))}%` }} />
    </div>
  );
}
