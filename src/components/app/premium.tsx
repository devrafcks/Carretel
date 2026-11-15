"use client";
import { useTranslations } from "next-intl";
import { Lock, Sparkles } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Selo "PRO" discreto ao lado de itens do plano completo. */
export function ProBadge({ className }: { className?: string }) {
  const t = useTranslations("premium");
  return <span className={cn("inline-flex items-center rounded-full bg-mint-100 px-1.5 py-0.5 text-[0.625rem] font-semibold tracking-wide text-vivid-strong", className)}>{t("badge")}</span>;
}

/**
 * Recurso do plano completo. Liberado: mostra o conteúdo. Bloqueado: mostra um exemplo desfocado
 * (dados de exemplo, nunca os reais) com cadeado e o convite para ativar o plano.
 */
export function PremiumGate({ unlocked, children, title, teaser, compact = false, className }: { unlocked: boolean; children: React.ReactNode; title?: string; teaser?: string | null; compact?: boolean; className?: string }) {
  const t = useTranslations("premium");
  if (unlocked) return <>{children}</>;
  return (
    <div className={cn("relative isolate overflow-hidden rounded-3xl", className)}>
      <div aria-hidden="true" inert className="pointer-events-none select-none opacity-50 blur-[3px]">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-background/40 via-background/70 to-background/90 p-4">
        <div className={cn("w-full max-w-xs rounded-3xl border border-ink/[0.06] bg-card text-center shadow-lift", compact ? "p-4" : "p-6")}>
          <span className="mx-auto inline-flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Lock aria-hidden="true" className="size-5" />
          </span>
          {teaser ? <p className="mt-3 text-sm text-muted-foreground">{teaser}</p> : null}
          <p className={cn("font-medium", teaser ? "mt-1" : "mt-3")}>{title ?? t("lockedTitle")}</p>
          {!compact ? <p className="mt-1 text-sm text-muted-foreground">{t("lockedBody")}</p> : null}
          <Link href="/assinar" className="mt-4 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85">
            <Sparkles aria-hidden="true" className="size-4" />
            {t("unlock")}
          </Link>
        </div>
      </div>
      <span className="absolute left-4 top-4 rounded-full bg-card/90 px-2.5 py-1 text-[0.6875rem] font-medium text-muted-foreground shadow-soft">{t("sample")}</span>
    </div>
  );
}
