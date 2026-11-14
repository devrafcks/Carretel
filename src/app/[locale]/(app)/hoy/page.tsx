import { getTranslations, setRequestLocale } from "next-intl/server";
import { Clock, Mic, Camera, ChevronRight, Truck } from "lucide-react";
import { requireWorkshop } from "@/lib/session";
import { dashboardSummary, listBatches } from "@/server/queries";
import { Link } from "@/i18n/navigation";
import { Card, Notice } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SpoolIllustration } from "@/components/brand/illustrations";
import { StatusBadge, batchTone } from "@/components/ui/status-badge";
import { PendingSyncNote } from "@/components/app/pending-sync-note";
import { formatDate } from "@/lib/dates";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

export default async function HoyPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ welcome?: string }> }) {
  const { locale } = await params;
  const { welcome } = await searchParams;
  setRequestLocale(locale);
  const ctx = await requireWorkshop();
  const t = await getTranslations();
  const s = await dashboardSummary(ctx.tdb);
  const recent = await listBatches(ctx.tdb, { limit: 5 });
  const isFree = ctx.workshop.planStatus === "free" || ctx.workshop.planStatus === "pending_checkout";

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display">{t("hoy.title")}</h1>
        <p className="text-muted-foreground">
          {new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone: "America/Sao_Paulo" }).format(new Date())}
        </p>
      </div>

      {welcome ? (
        <Notice tone="success" role="status">
          <p className="font-semibold">{t("hoy.welcome")}</p>
        </Notice>
      ) : null}

      <PendingSyncNote />

      {/* 3 cards: Me deben · En producción · Pago del sábado */}
      <section aria-label={t("hoy.title")} className="grid gap-3 sm:grid-cols-3">
        <Link href="/cobros" className="group block rounded-lg">
          <Card className={cn("ficha-corner h-full p-4", s.owedCents > 0 && "border-primary")}>
            <p className="font-semibold text-muted-foreground">{t("hoy.owedLabel")}</p>
            <p className="mt-1 text-[2rem] font-bold leading-tight">
              <Money cents={s.owedCents} locale={locale} />
            </p>
            <p className="mt-1">{t("hoy.owedSub", { count: s.openCount })}</p>
            {s.oldestOpenDays > 0 ? (
              <p className={cn("mt-1 font-semibold", s.oldestOpenDays > 15 ? "text-overdue-calote-fg" : "text-foreground")}>
                {t("hoy.oldest", { days: t("common.days", { count: s.oldestOpenDays }) })}
              </p>
            ) : null}
          </Card>
        </Link>
        <Link href="/lotes" className="block rounded-lg">
          <Card className="h-full p-4">
            <p className="font-semibold text-muted-foreground">{t("hoy.productionLabel")}</p>
            <p className="mt-1 text-[2rem] font-bold leading-tight tabular-money">{t("common.pieces", { count: s.piecesInProduction })}</p>
            <p className="mt-1">{t("hoy.productionSub", { count: s.batchesInProduction })}</p>
          </Card>
        </Link>
        <Link href="/produccion?tab=acerto" className="block rounded-lg">
          <Card className="h-full p-4">
            <p className="font-semibold text-muted-foreground">{t("hoy.payrollLabel")}</p>
            <p className="mt-1 text-[2rem] font-bold leading-tight">
              <Money cents={Math.max(0, s.payrollPendingCents)} locale={locale} />
            </p>
            <p className="mt-1">{t("hoy.payrollSub", { date: formatDate(s.period.end, locale) })}</p>
          </Card>
        </Link>
      </section>

      {s.awaitingCount > 0 ? (
        <Link href="/cobros" className="block">
          <Notice tone="awaiting" icon={<Clock />}>
            <p className="font-semibold">{t("hoy.awaiting", { count: s.awaitingCount })}</p>
          </Notice>
        </Link>
      ) : null}

      {isFree ? (
        <p className="text-muted-foreground">
          {t("hoy.freeLeft", { used: Math.min(ctx.workshop.freeBatchesUsed, brand.freeBatchLimit), limit: brand.freeBatchLimit })}
        </p>
      ) : null}

      {s.totalBatches === 0 ? (
        <>
          <Card className="border-primary p-4">
            <h2 className="font-display text-xl">{t("hoy.onboardingTitle")}</h2>
            <p className="mt-1">{t("hoy.onboardingBody")}</p>
            <ul className="mt-3 flex flex-wrap gap-3 text-muted-foreground" aria-hidden="true">
              <li className="inline-flex items-center gap-1.5">
                <Camera className="size-5" /> 1
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Mic className="size-5" /> 2
              </li>
            </ul>
          </Card>
          <EmptyState
            illustration={<SpoolIllustration />}
            title={t("hoy.empty")}
            action={
              <Link href="/lotes/nuevo" className={buttonVariants({ size: "lg", block: true })}>
                {t("hoy.emptyCta")}
              </Link>
            }
          />
        </>
      ) : (
        <>
          {s.dueSoon.length > 0 ? (
            <section aria-labelledby="due-soon">
              <h2 id="due-soon" className="mb-2 font-display">
                {t("hoy.dueSoon")}
              </h2>
              <ul className="space-y-2">
                {s.dueSoon.map((b) => (
                  <li key={b.id}>
                    <Link href={`/lotes/${b.id}`} className="flex min-h-14 items-center gap-3 rounded-lg border border-rework-border bg-rework-bg px-3 py-2 text-rework-fg">
                      <Truck aria-hidden="true" className="size-5 shrink-0" />
                      <span className="min-w-0 flex-1 font-semibold">
                        {b.reference ? `${t("common.reference")} ${b.reference}` : t("batch.noRef")} · <span className="tabular-money">{t("common.pieces", { count: b.quantity })}</span>
                      </span>
                      <span className="shrink-0 font-semibold">{t("hoy.dueOn", { date: formatDate(b.dueDate!, locale) })}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="recent">
            <div className="mb-2 flex items-center justify-between">
              <h2 id="recent" className="font-display">
                {t("hoy.recent")}
              </h2>
              <Link href="/lotes" className="inline-flex min-h-12 items-center font-semibold text-primary underline-offset-4 hover:underline">
                {t("common.seeAll")}
              </Link>
            </div>
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {recent.map(({ batch: b, clientName }) => (
                <li key={b.id}>
                  <Link href={`/lotes/${b.id}`} className="flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-muted">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">
                        {clientName ?? t("common.noClient")} · {b.reference ? `${t("common.reference")} ${b.reference}` : t("batch.noRef")}
                      </p>
                      <p className="text-muted-foreground">
                        <span className="tabular-money">{t("common.pieces", { count: b.quantity })}</span> · <Money cents={b.totalCents} locale={locale} className="text-foreground" />
                      </p>
                    </div>
                    <StatusBadge tone={batchTone[b.status]!.tone} icon={batchTone[b.status]!.icon} label={t(`status.batch.${b.status}`)} />
                    <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
