import * as React from "react";
import { ArrowLeft } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Círculos sobrepostos (hachura + menta + branco) — decoração da referência Aidency. */
export function Orbs({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("relative size-36 shrink-0", className)}>
      <span className="bg-hatch absolute left-0 top-3 size-24 rounded-full" />
      <span className="absolute right-0 top-0 size-28 rounded-full bg-mint-200/80" />
      <span className="absolute bottom-0 left-8 size-16 rounded-full border border-white bg-white/70 shadow-soft" />
      <span className="absolute right-3 top-6 size-2.5 rounded-full bg-vivid" />
      <span className="absolute bottom-5 left-3 size-2.5 rounded-full bg-vivid" />
    </div>
  );
}

/**
 * Cabeçalho de tela minimalista: rótulo pequeno com ponto verde, título fino,
 * subtítulo suave e círculos decorativos. `illustration`/`tone` ficam aceitos por compatibilidade.
 */
export function PageHeader({
  title,
  subtitle,
  kicker,
  backHref,
  backLabel,
  action,
  children,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  kicker?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  action?: React.ReactNode;
  illustration?: string;
  tone?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="anim-rise mb-6 flex items-center gap-6">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          {backHref ? (
            <Link
              href={backHref}
              aria-label={backLabel}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-ink/10 bg-card text-foreground transition-colors hover:border-ink/30"
            >
              <ArrowLeft aria-hidden="true" className="size-5" />
            </Link>
          ) : null}
          {kicker ? (
            <p className="inline-flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
              <span className="size-2 shrink-0 rounded-full bg-vivid" aria-hidden="true" />
              <span className="truncate">{kicker}</span>
            </p>
          ) : null}
        </div>
        <h1 className="mt-3 font-display text-[2rem] font-light leading-[1.05] tracking-tight sm:text-5xl">{title}</h1>
        {subtitle ? <div className="mt-2 max-w-xl text-muted-foreground">{subtitle}</div> : null}
        {children ? <div className="mt-4">{children}</div> : null}
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
      <Orbs className="hidden sm:block" />
    </section>
  );
}
