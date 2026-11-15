/**
 * Gráficos do painel (SVG/HTML puros, renderizados no servidor). Regras do dataviz:
 * marcas finas com pontas arredondadas, 2px de respiro entre fatias/segmentos, legenda com valores
 * sempre que há 2+ séries, dica ao passar o mouse e a mesma informação em texto para leitor de tela.
 * Cores categóricas em ordem fixa: --chart-1..5 (globals.css). Texto nunca usa a cor da série.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

export const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"] as const;

/** Dica que aparece ao passar o mouse (ou focar) sobre a marca; o pai precisa de `group relative`. */
function Tip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs text-white opacity-0 shadow-lift transition-opacity duration-150 group-hover:opacity-100",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Tabela escondida com os mesmos números (leitor de tela). */
function SrTable({ caption, rows }: { caption: string; rows: [string, string][] }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <tbody>
        {rows.map(([k, v], i) => (
          <tr key={k + i}>
            <th scope="row">{k}</th>
            <td>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export type Slice = { key: string; label: string; value: number; display: string; color?: string };

/** Rosca (participação). Até 5 fatias; o resto deve vir agrupado em "Outros". */
export function Donut({ slices, label, center, className }: { slices: Slice[]; label: string; center?: { value: string; label: string }; className?: string }) {
  const total = slices.reduce((a, s) => a + s.value, 0);
  const R = 52;
  const C = 2 * Math.PI * R;
  const gap = slices.filter((s) => s.value > 0).length > 1 ? 2.5 : 0; // respiro entre fatias, em unidades do traço
  let offset = 0;
  return (
    <figure className={cn("flex flex-col items-center gap-5 sm:flex-row sm:items-center", className)}>
      <div className="relative size-40 shrink-0">
        <svg viewBox="0 0 128 128" className="size-full -rotate-90" aria-hidden="true">
          <circle cx="64" cy="64" r={R} fill="none" stroke="var(--mint-50)" strokeWidth="14" />
          {total > 0
            ? slices.map((s, i) => {
                if (s.value <= 0) return null;
                const len = (s.value / total) * C;
                const dash = Math.max(0.5, len - gap);
                const el = (
                  <circle
                    key={s.key}
                    cx="64"
                    cy="64"
                    r={R}
                    fill="none"
                    stroke={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
                    strokeWidth="14"
                    strokeDasharray={`${dash} ${C - dash}`}
                    strokeDashoffset={-offset}
                    className="transition-[stroke-width] duration-150 hover:[stroke-width:17]"
                  >
                    <title>{`${s.label}: ${s.display} (${Math.round((s.value / total) * 100)}%)`}</title>
                  </circle>
                );
                offset += len;
                return el;
              })
            : null}
        </svg>
        {center ? (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="max-w-26 truncate text-base font-normal tabular-money">{center.value}</span>
            <span className="max-w-24 text-[0.6875rem] leading-tight text-muted-foreground">{center.label}</span>
          </div>
        ) : null}
      </div>
      <ul className="w-full min-w-0 space-y-2 text-sm">
        {slices.map((s, i) => (
          <li key={s.key} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.color ?? CHART_COLORS[i % CHART_COLORS.length] }} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{s.label}</span>
            <span className="shrink-0 tabular-money">{s.display}</span>
            <span className="w-10 shrink-0 text-right text-xs text-muted-foreground tabular-money">{total ? `${Math.round((s.value / total) * 100)}%` : "–"}</span>
          </li>
        ))}
      </ul>
      <SrTable caption={label} rows={slices.map((s) => [s.label, s.display])} />
    </figure>
  );
}

/** Uma barra empilhada horizontal (etapas, situação). */
export function Segments({ parts, label, className }: { parts: Slice[]; label: string; className?: string }) {
  const total = parts.reduce((a, p) => a + p.value, 0);
  return (
    <figure className={className}>
      <div className="flex h-3 w-full gap-[2px] overflow-visible" aria-hidden="true">
        {total === 0 ? (
          <span className="h-full w-full rounded-full bg-mint-50" />
        ) : (
          parts
            .filter((p) => p.value > 0)
            .map((p) => {
              const i = parts.indexOf(p);
              return (
                <span key={p.key} className="group relative h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${(p.value / total) * 100}%`, background: p.color ?? CHART_COLORS[i % CHART_COLORS.length] }}>
                  <Tip>
                    {p.label}: {p.display}
                  </Tip>
                </span>
              );
            })
        )}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
        {parts.map((p, i) => (
          <li key={p.key} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: p.color ?? CHART_COLORS[i % CHART_COLORS.length] }} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{p.label}</span>
            <span className="shrink-0 font-medium tabular-money">{p.display}</span>
          </li>
        ))}
      </ul>
      <SrTable caption={label} rows={parts.map((p) => [p.label, p.display])} />
    </figure>
  );
}

export type Point = { key: string; label: string; value: number; display: string };

/** Colunas finas de uma série (semanas, dias da semana). A última pode ficar destacada. */
export function Columns({ data, label, highlight = "last", className, height = "h-40" }: { data: Point[]; label: string; highlight?: "last" | "max" | "none"; className?: string; height?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const maxIdx = data.reduce((m, d, i) => (d.value > (data[m]?.value ?? -1) ? i : m), 0);
  return (
    <figure className={className}>
      <div className={cn("flex items-end gap-1.5 sm:gap-3", height)} aria-hidden="true">
        {data.map((d, i) => {
          const hot = (highlight === "last" && i === data.length - 1) || (highlight === "max" && i === maxIdx && d.value > 0);
          return (
            <div key={d.key} className="group relative flex h-full flex-1 flex-col items-center justify-end gap-2">
              <span
                className={cn("anim-bar block w-2.5 rounded-t-[4px] rounded-b-[2px] sm:w-3.5", d.value === 0 ? "bg-ink/10" : hot ? "bg-vivid" : "bg-ink/25")}
                style={{ height: `${d.value === 0 ? 3 : Math.max(4, (d.value / max) * 100)}%`, animationDelay: `${i * 30}ms` }}
              />
              <span className="text-[0.6875rem] text-muted-foreground">{d.label}</span>
              <Tip className="bottom-auto top-0 -translate-y-full">
                {d.label}: {d.display}
              </Tip>
            </div>
          );
        })}
      </div>
      <SrTable caption={label} rows={data.map((d) => [d.label, d.display])} />
    </figure>
  );
}

/** Linha com área suave (tendência mensal). Uma série, um eixo. */
export function LineArea({ data, label, className, minLabel, maxLabel }: { data: Point[]; label: string; className?: string; minLabel?: string; maxLabel?: string }) {
  const W = 600;
  const H = 180;
  const PAD = 10;
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = data.length > 1 ? (W - PAD * 2) / (data.length - 1) : 0;
  const x = (i: number) => PAD + i * step;
  const y = (v: number) => H - PAD - (v / max) * (H - PAD * 2);
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const area = data.length ? `${line} L${x(data.length - 1).toFixed(1)},${H - PAD} L${x(0).toFixed(1)},${H - PAD} Z` : "";
  const gid = "la" + Array.from(label).reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7).toString(36);
  const lastIdx = data.length - 1;
  return (
    <figure className={className}>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-44 w-full overflow-visible" aria-hidden="true">
          <defs>
            <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={PAD} x2={W - PAD} y1={PAD + f * (H - PAD * 2)} y2={PAD + f * (H - PAD * 2)} stroke="var(--grid-line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
          <line x1={PAD} x2={W - PAD} y1={H - PAD} y2={H - PAD} stroke="var(--border)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <path d={area} fill={`url(#${gid})`} />
          <path d={line} fill="none" stroke="var(--chart-1)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {/* pontos e alvos de hover em HTML (não deformam com o preserveAspectRatio) */}
        <div className="absolute inset-0">
          {data.map((d, i) => (
            <div key={d.key} className="group absolute top-0 h-full -translate-x-1/2" style={{ left: `${(x(i) / W) * 100}%`, width: `${Math.max(6, 100 / Math.max(1, data.length))}%` }}>
              <span className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-ink/15 group-hover:block" />
              <span
                className={cn(
                  "absolute left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card",
                  i === lastIdx ? "bg-[var(--chart-1)]" : "bg-[var(--chart-1)] opacity-0 group-hover:opacity-100",
                )}
                style={{ top: `${(y(d.value) / H) * 100}%` }}
              />
              <Tip className="bottom-auto top-0 -translate-y-full">
                {d.label}: {d.display}
              </Tip>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex justify-between text-[0.6875rem] text-muted-foreground">
        {data.map((d, i) => (
          <span key={d.key} className={cn(data.length > 7 && i % 2 === 1 && "hidden sm:inline")}>
            {d.label}
          </span>
        ))}
      </div>
      {minLabel || maxLabel ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {maxLabel}
          {minLabel ? ` · ${minLabel}` : null}
        </p>
      ) : null}
      <SrTable caption={label} rows={data.map((d) => [d.label, d.display])} />
    </figure>
  );
}

/** Calendário de calor (dias x semanas), rampa sequencial menta → verde. */
export function Heatmap({ days, label, weekdayLabels, format, className, legend }: { days: { day: string; value: number }[]; label: string; weekdayLabels: string[]; format: (v: number, day: string) => string; className?: string; legend: { less: string; more: string } }) {
  const ramp = ["var(--mint-50)", "var(--mint-100)", "var(--mint-200)", "var(--mint-400)", "var(--chart-1)", "var(--vivid-strong)"];
  const max = Math.max(1, ...days.map((d) => d.value));
  const level = (v: number) => (v <= 0 ? 0 : Math.min(5, 1 + Math.floor((v / max) * 4.999)));
  // começa numa segunda: completa a primeira coluna com vazios
  const first = days[0] ? (new Date(days[0].day + "T12:00:00Z").getUTCDay() + 6) % 7 : 0;
  const cells: ({ day: string; value: number } | null)[] = [...Array(first).fill(null), ...days];
  const cols = Math.ceil(cells.length / 7);
  return (
    <figure className={className}>
      <div className="flex gap-2">
        <div className="grid grid-rows-7 gap-[3px] text-[0.625rem] text-muted-foreground" aria-hidden="true">
          {weekdayLabels.map((w, i) => (
            <span key={w + i} className={cn("flex h-3.5 items-center sm:h-4", i % 2 === 1 && "invisible")}>
              {w}
            </span>
          ))}
        </div>
        <div className="grid flex-1 grid-flow-col grid-rows-7 gap-[3px]" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} aria-hidden="true">
          {cells.map((c, i) =>
            c ? (
              <span key={c.day} className="group relative h-3.5 rounded-[3px] sm:h-4" style={{ background: ramp[level(c.value)] }}>
                <Tip>{format(c.value, c.day)}</Tip>
              </span>
            ) : (
              <span key={"e" + i} className="h-3.5 sm:h-4" />
            ),
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[0.6875rem] text-muted-foreground" aria-hidden="true">
        {legend.less}
        {ramp.map((c) => (
          <span key={c} className="size-3 rounded-[3px]" style={{ background: c }} />
        ))}
        {legend.more}
      </div>
      <SrTable caption={label} rows={days.filter((d) => d.value > 0).map((d) => [d.day, format(d.value, d.day)])} />
    </figure>
  );
}

/** Cartão de gráfico padrão do painel. */
export function ChartCard({ title, lead, badge, children, className, action, quiet = false }: { title: string; lead?: string; badge?: React.ReactNode; children: React.ReactNode; className?: string; action?: React.ReactNode; quiet?: boolean }) {
  return (
    <section className={cn("rounded-3xl border border-ink/[0.06] bg-card p-6 shadow-soft", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {/* quiet: título cinza e leve, como os cartões do Hoje */}
          <h2 className={cn("inline-flex items-center gap-2", quiet ? "font-normal text-muted-foreground" : "font-medium")}>
            {title} {badge}
          </h2>
          {lead ? <p className="mt-0.5 text-sm text-muted-foreground">{lead}</p> : null}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
