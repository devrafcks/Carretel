import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChevronRight, Truck, Clock, Plus } from "@/components/icons";
import { requireWorkshop } from "@/lib/session";
import { dashboardSummary, listBatches, productionSeries, monthCollection } from "@/server/queries";
import { Link } from "@/i18n/navigation";
import { Card, Notice } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SpoolIllustration } from "@/components/brand/illustrations";
import { StatusBadge, batchTone } from "@/components/ui/status-badge";
import { PendingSyncNote } from "@/components/app/pending-sync-note";
import { ThinBars, SplitBar } from "@/components/app/charts";
import { formatDate } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

export default async function HoyPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ welcome?: string }> }) {
  const { locale } = await params;
  const { welcome } = await searchParams;
  setRequestLocale(locale);
  const ctx = await requireWorkshop();
  const t = await getTranslations();
  const [s, recent, series, month] = await Promise.all([
    dashboardSummary(ctx.tdb),
    listBatches(ctx.tdb, { limit: 6 }),
    productionSeries(ctx.tdb, 14),
    monthCollection(ctx.tdb),
  ]);
  const isFree = ctx.workshop.planStatus === "free" || ctx.workshop.planStatus === "pending_checkout";
  const todayPieces = series[series.length - 1]?.pieces ?? 0;
  const weekPieces = series.slice(-7).reduce((a, d) => a + d.pieces, 0);
  const dateLabel = new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", timeZone: "America/Sao_Paulo" }).format(new Date());

  return (
    <div className="space-y-6">
      {/* ── Visão geral (referência: painel Aidency) ── */}
      <section className="anim-rise overflow-hidden rounded-[2rem] border border-ink/[0.06] bg-card shadow-soft">
        <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.1fr_1fr] lg:p-10">
          <div className="flex flex-col">
            <p className="inline-flex items-center gap-2 text-sm text-muted-foreground first-letter:uppercase">
              <span className="size-2 rounded-full bg-vivid" aria-hidden="true" />
              {dateLabel}
            </p>
            <h1 className="mt-4 font-display text-[2.5rem] font-light uppercase leading-[1] tracking-tight sm:text-6xl">{t("hoy.title")}</h1>
            <p className="mt-3 max-w-md text-muted-foreground">{t("hoy.greeting", { name: ctx.workshop.name })}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/lotes/nuevo" className={buttonVariants({ size: "lg" })}>
                <Plus aria-hidden="true" />
                {t("nav.newBatchAria")}
              </Link>
              {isFree ? (
                <span className="text-sm text-muted-foreground">
                  {t("hoy.freeLeft", { used: Math.min(ctx.workshop.freeBatchesUsed, brand.freeBatchLimit), limit: brand.freeBatchLimit })}{" "}
                  <Link href="/assinar" className="font-medium text-foreground underline underline-offset-4">
                    {t("subscribe.upgrade")}
                  </Link>
                </span>
              ) : null}
            </div>
          </div>

          {/* círculos com os números ao redor */}
          <div className="relative mx-auto aspect-[4/3] w-full max-w-md">
            <span aria-hidden="true" className="bg-hatch absolute left-[6%] top-[14%] size-[46%] rounded-full" />
            <span aria-hidden="true" className="anim-pop absolute right-[4%] top-[2%] size-[62%] rounded-full bg-mint-200/80" />
            <span aria-hidden="true" className="anim-pop delay-2 absolute bottom-[4%] left-[30%] size-[34%] rounded-full border border-white bg-white/80 shadow-soft" />
            <Link href="/cobros" className="group absolute left-0 top-0 text-left">
              <span className="block text-2xl font-light sm:text-3xl">
                <Money cents={s.owedCents} locale={locale} />
              </span>
              <span className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground group-hover:text-foreground">
                <span className="size-2 rounded-full bg-vivid" aria-hidden="true" />
                {t("hoy.owedLabel")}
              </span>
            </Link>
            <Link href="/lotes" className="group absolute bottom-[14%] left-0 text-left">
              <span className="block text-2xl font-light tabular-money sm:text-3xl">{s.piecesInProduction}</span>
              <span className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground group-hover:text-foreground">
                <span className="size-2 rounded-full bg-vivid" aria-hidden="true" />
                {t("hoy.productionLabel")}
              </span>
            </Link>
            <Link href="/produccion?tab=acerto" className="group absolute bottom-0 right-0 text-right">
              <span className="block text-2xl font-light sm:text-3xl">
                <Money cents={Math.max(0, s.payrollPendingCents)} locale={locale} />
              </span>
              <span className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground group-hover:text-foreground">
                <span className="size-2 rounded-full bg-vivid" aria-hidden="true" />
                {t("hoy.payrollLabel")}
              </span>
            </Link>
            {s.oldestOpenDays > 0 ? (
              <div className="absolute right-0 top-[8%] rounded-2xl border border-ink/[0.06] bg-card px-4 py-3 shadow-soft">
                <p className="text-xs text-muted-foreground">{t("hoy.oldest")}</p>
                <p className={cn("text-lg font-medium tabular-money", s.oldestOpenDays > 15 && "text-overdue-calote-fg")}>{t("common.days", { count: s.oldestOpenDays })}</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {welcome ? (
        <Notice tone="success" role="status">
          <p className="font-medium">{t("hoy.welcome")}</p>
        </Notice>
      ) : null}
      <PendingSyncNote />
      {s.awaitingCount > 0 ? (
        <Link href="/cobros" className="block">
          <Notice tone="awaiting" icon={<Clock />}>
            <p className="font-medium">{t("hoy.awaiting", { count: s.awaitingCount })}</p>
          </Notice>
        </Link>
      ) : null}

      {/* ── Cartões com gráficos finos ── */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="anim-rise delay-1 p-6 md:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-muted-foreground">{t("hoy.perDay")}</p>
              <p className="mt-1 text-4xl font-light tabular-money">
                {todayPieces}
                <span className="ml-2 text-base text-muted-foreground">{t("common.today").toLowerCase()}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-light tabular-money">{weekPieces}</p>
              <p className="text-sm text-muted-foreground">{t("hoy.last7")}</p>
            </div>
          </div>
          <ThinBars className="mt-6" values={series.map((d) => d.pieces)} label={t("hoy.perDay")} />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground tabular-money">
            <span>{formatDate(series[0]!.day, locale)}</span>
            <span>{formatDate(series[series.length - 1]!.day, locale)}</span>
          </div>
        </Card>
        <Card className="anim-rise delay-2 flex flex-col p-6">
          <p className="text-muted-foreground">{t("hoy.collected")}</p>
          <p className="mt-1 text-5xl font-light tabular-money">
            {Math.floor(month.pct)}
            <span className="text-muted-foreground">,{String(Math.round((month.pct % 1) * 100)).padStart(2, "0")} %</span>
          </p>
          <SplitBar className="mt-auto" pct={month.pct} />
          <p className="mt-3 text-sm text-muted-foreground tabular-money">
            {t("hoy.collectedOf", { paid: formatBRL(month.paidCents, locale), total: formatBRL(month.issuedCents, locale) })}
          </p>
        </Card>
      </section>

      {s.totalBatches === 0 ? (
        <EmptyState
          illustration={<SpoolIllustration />}
          title={t("hoy.empty")}
          action={
            <Link href="/lotes/nuevo" className={buttonVariants({ size: "lg", block: true })}>
              {t("hoy.emptyCta")}
            </Link>
          }
        >
          {t("hoy.onboardingBody")}
        </EmptyState>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section aria-labelledby="recent">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="recent" className="text-xl font-medium">
                {t("hoy.recent")}
              </h2>
              <Link href="/lotes" className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                {t("common.seeAll")}
              </Link>
            </div>
            <ul className="divide-y divide-ink/[0.06] overflow-hidden rounded-3xl border border-ink/[0.06] bg-card shadow-soft">
              {recent.map(({ batch: b, clientName }) => (
                <li key={b.id}>
                  <Link href={`/lotes/${b.id}`} className="flex min-h-16 items-center gap-3 px-5 py-3.5 transition-colors hover:bg-mint-50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {clientName ?? t("common.noClient")} · {b.reference ? `${t("common.reference")} ${b.reference}` : t("batch.noRef")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="tabular-money">{t("common.pieces", { count: b.quantity })}</span> · <Money cents={b.totalCents} locale={locale} />
                      </p>
                    </div>
                    <StatusBadge tone={batchTone[b.status]!.tone} icon={batchTone[b.status]!.icon} label={t(`status.batch.${b.status}`)} />
                    <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="due-soon">
            <h2 id="due-soon" className="mb-3 text-xl font-medium">
              {t("hoy.dueSoon")}
            </h2>
            {s.dueSoon.length ? (
              <ul className="space-y-3">
                {s.dueSoon.map((b) => (
                  <li key={b.id}>
                    <Link href={`/lotes/${b.id}`} className="flex min-h-16 items-center gap-3 rounded-3xl border border-ink/[0.06] bg-card px-5 py-3.5 shadow-soft transition-colors hover:bg-mint-50">
                      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-rework-bg text-rework-fg">
                        <Truck aria-hidden="true" className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{b.reference ? `${t("common.reference")} ${b.reference}` : t("batch.noRef")}</span>
                        <span className="block text-sm text-muted-foreground tabular-money">{t("common.pieces", { count: b.quantity })}</span>
                      </span>
                      <span className="shrink-0 text-sm">{t("hoy.dueOn", { date: formatDate(b.dueDate!, locale) })}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-3xl border border-dashed border-ink/10 px-5 py-8 text-center text-muted-foreground">{t("hoy.noDue")}</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
