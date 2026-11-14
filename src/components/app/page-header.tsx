import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Tone = "indigo" | "terracota" | "leaf" | "sun" | "ink";

const toneClass: Record<Tone, string> = {
  indigo: "bg-primary text-primary-foreground",
  terracota: "bg-vivid-strong text-primary-foreground",
  leaf: "bg-paid-solid text-paid-solid-fg",
  sun: "bg-sun text-ink",
  ink: "bg-ink text-primary-foreground",
};
const kickerClass: Record<Tone, string> = {
  indigo: "text-sun",
  terracota: "text-sun",
  leaf: "text-sun",
  sun: "text-vivid-strong",
  ink: "text-sun",
};

/**
 * Cabeçalho de tela. Com `illustration`, vira uma faixa colorida com ilustração e animação de entrada
 * (mesma linguagem da landing). Sem ilustração, é um título simples.
 */
export function PageHeader({
  title,
  subtitle,
  kicker,
  backHref,
  backLabel,
  action,
  illustration,
  tone = "indigo",
  children,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  kicker?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  action?: React.ReactNode;
  illustration?: string;
  tone?: Tone;
  children?: React.ReactNode;
}) {
  const back = backHref ? (
    <Link
      href={backHref}
      aria-label={backLabel}
      className={cn(
        "-ml-2 inline-flex size-12 shrink-0 items-center justify-center rounded-xl",
        illustration ? "hover:bg-white/10" : "hover:bg-muted",
      )}
    >
      <ArrowLeft aria-hidden="true" className="size-6" />
    </Link>
  ) : null;

  if (!illustration) {
    return (
      <div className="anim-rise mb-5 flex items-start gap-2">
        {back}
        <div className="min-w-0 flex-1 pt-1.5">
          {kicker ? <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-vivid-strong">{kicker}</p> : null}
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-0.5 text-muted-foreground">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0 pt-1">{action}</div> : null}
      </div>
    );
  }

  return (
    <section className={cn("anim-rise relative mb-5 overflow-hidden rounded-3xl p-5 shadow-lift sm:p-6", toneClass[tone])}>
      <div className="absolute -right-12 -top-12 size-48 rounded-full border-[28px] border-white/10" aria-hidden="true" />
      <div className="relative flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1">
            {back}
            <div className="min-w-0 flex-1 pt-1">
              {kicker ? <p className={cn("text-sm font-extrabold uppercase tracking-[0.16em]", kickerClass[tone])}>{kicker}</p> : null}
              <h1 className="font-display text-2xl font-extrabold leading-tight sm:text-3xl">{title}</h1>
              {subtitle ? <div className="mt-1 opacity-90">{subtitle}</div> : null}
            </div>
          </div>
          {children ? <div className="mt-4">{children}</div> : null}
          {action ? <div className="mt-4">{action}</div> : null}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={illustration} alt="" width={480} height={480} className="anim-float size-24 shrink-0 rounded-[1.5rem] object-cover shadow-soft ring-4 ring-white/15 sm:size-32" />
      </div>
    </section>
  );
}
