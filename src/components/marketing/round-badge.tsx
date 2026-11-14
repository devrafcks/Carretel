import { cn } from "@/lib/utils";

/** Selo circular com texto girando ao redor (referência: selos de preço do Dribbble/KITRATSU). */
export function RoundBadge({ ring, value, sub, className }: { ring: string; value: string; sub?: string; className?: string }) {
  const id = "rb-" + ring.replace(/[^a-z0-9]/gi, "").slice(0, 12);
  return (
    <div className={cn("relative size-32 shrink-0 rounded-full bg-ink text-primary-foreground shadow-lift sm:size-36", className)}>
      <svg viewBox="0 0 100 100" className="anim-spin-slow absolute inset-0 size-full" aria-hidden="true">
        <defs>
          <path id={id} d="M50 50 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0" />
        </defs>
        <text fill="currentColor" fontSize="8.4" fontWeight="800" letterSpacing="2.2" className="font-mono uppercase">
          <textPath href={`#${id}`} textLength="234" lengthAdjust="spacing">{ring}</textPath>
        </text>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-display text-3xl font-black leading-none text-sun sm:text-4xl">{value}</span>
        {sub ? <span className="mt-1 text-xs font-bold">{sub}</span> : null}
      </div>
    </div>
  );
}

/** Divisor ondulado com costura (ponto reto) — transição entre seções. */
export function StitchWave({ className, fill = "var(--ink)" }: { className?: string; fill?: string }) {
  return (
    <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className={cn("block h-10 w-full sm:h-14", className)} aria-hidden="true">
      <path d="M0 60 V30 C 180 0, 360 0, 540 26 S 900 58, 1080 30 S 1320 0, 1440 24 V60 Z" fill={fill} />
      <path
        d="M0 44 C 180 14, 360 14, 540 40 S 900 72, 1080 44 S 1320 14, 1440 38"
        fill="none"
        stroke="var(--sun)"
        strokeWidth="3"
        strokeDasharray="14 10"
        strokeLinecap="round"
      />
    </svg>
  );
}
