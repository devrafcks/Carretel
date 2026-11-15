import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChevronRight, Truck, Clock, Plus, Check, UserPlus, Scissors, MessageCircle } from "@/components/icons";
import { requireWorkshop } from "@/lib/session";
import { dashboardSummary, listBatches, productionSeries, monthCollection } from "@/server/queries";
import { Link } from "@/i18n/navigation";
import { Card, Notice } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { buttonVariants } from "@/components/ui/button";
import { Orbs } from "@/components/app/page-header";
import { StatusBadge, batchTone } from "@/components/ui/status-badge";
import { PendingSyncNote } from "@/components/app/pending-sync-note";
import { ThinBars, SplitBar } from "@/components/app/charts";
import { formatDate } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";
import { isPremium } from "@/lib/subscription";
import { monthNumbers, monthlyRevenue, topDebtors, workerProductivity } from "@/server/reports";
import { PairBars, HBars } from "@/components/app/report-charts";
import { PremiumGate, ProBadge } from "@/components/app/premium";
import { agingBuckets, batchPipeline, paymentMethods, weekKeys, weeklyDelivered } from "@/server/analytics";
import { ChartCard, Columns, Donut, Segments } from "@/components/app/viz";

/* exemplos (desfocados) para quem ainda não assina — nunca os dados reais */
const SAMPLE_REVENUE = [480000, 560000, 510000, 640000, 700000, 760000].map((v, i) => ({ month: `2026-${String(i + 4).padStart(2, "0")}`, issuedCents: v, paidCents: Math.round(v * 0.85) }));
const SAMPLE_WEEKLY = () => weekKeys(8).map((w, i) => ({ week: w, pieces: [420, 510, 380, 600, 560, 640, 590, 700][i]! }));
const SAMPLE_MONTH = { batches: 11, receivedCents: 1180000, avgPricePerPieceCents: 310, avgTicketCents: 107000, deliveredPieces: 3200, deliveredCents: 990000 };

export default async function HoyPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ welcome?: string }> }) {
  const { locale } = await params;
  const { welcome } = await searchParams;
  setRequestLocale(locale);
  const ctx = await requireWorkshop();
  const t = await getTranslations();
  const fmt = (c: number) => formatBRL(c, locale);
  const monthLabel = (k: string) => new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(new Date(`${k}-15T12:00:00Z`)).replace(".", "");
  const premium = isPremium(ctx.workshop.planStatus, ctx.access);
  const [s, recent, series, month, debtors, teamWeek, revenue, mNums, realMonth] = await Promise.all([
    dashboardSummary(ctx.tdb),
    listBatches(ctx.tdb, { limit: 6 }),
    productionSeries(ctx.tdb, 14),
    monthCollection(ctx.tdb),
    topDebtors(ctx.tdb, 4),
    workerProductivity(ctx.tdb, 7),
    premium ? monthlyRevenue(ctx.tdb, 6) : Promise.resolve(SAMPLE_REVENUE),
    premium ? monthNumbers(ctx.tdb) : Promise.resolve(SAMPLE_MONTH),
    premium ? Promise.resolve(null) : monthNumbers(ctx.tdb),
  ]);
  const [pipeline, aging, weekly, methods] = await Promise.all([
    batchPipeline(ctx.tdb),
    agingBuckets(ctx.tdb),
    premium ? weeklyDelivered(ctx.tdb, 8) : Promise.resolve(SAMPLE_WEEKLY()),
    premium ? paymentMethods(ctx.tdb) : Promise.resolve({ pix: 820000, cash: 210000, other: 60000 }),
  ]);
  const weekLabel = (iso: string) => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(new Date(iso + "T12:00:00Z"));
  const agingTotal = aging.ok + aging.watch + aging.late + aging.critical;
  const methodsTotal = methods.pix + methods.cash + methods.other;
  const teaserWeekly = !premium && series.slice(-7).some((d) => d.pieces > 0) ? t("premium.teaserWeek", { count: series.slice(-7).reduce((a, d) => a + d.pieces, 0) }) : null;
  const teaserRevenue = !premium && month.issuedCents > 0 ? t("premium.teaserRevenue", { amount: fmt(month.issuedCents) }) : null;
  const teaserMonth = realMonth && realMonth.deliveredPieces > 0 ? t("premium.teaserPieces", { count: realMonth.deliveredPieces }) : null;
  const isFree = ctx.workshop.planStatus === "free" || ctx.workshop.planStatus === "pending_checkout";
  const todayPieces = series[series.length - 1]?.pieces ?? 0;
  const weekPieces = series.slice(-7).reduce((a, d) => a + d.pieces, 0);
  const firstRun = s.totalBatches === 0;
  const steps = [
    { done: s.totalClients > 0, href: "/clientes", icon: UserPlus, title: t("hoy.stepClient"), desc: t("hoy.stepClientDesc") },
    { done: s.totalBatches > 0, href: "/lotes/nuevo", icon: Scissors, title: t("hoy.stepBatch"), desc: t("hoy.stepBatchDesc") },
    { done: s.totalProofs > 0, href: "/lotes", icon: MessageCircle, title: t("hoy.stepProof"), desc: t("hoy.stepProofDesc") },
  ];
  const stepsDone = steps.filter((x) => x.done).length;
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
            <h1 className="mt-4 font-display text-[2.5rem] font-light leading-[1] tracking-tight sm:text-6xl">{t("hoy.title")}</h1>
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

          {firstRun ? (
            <Orbs className="mx-auto hidden self-center sm:block" />
          ) : (
          /* círculos com os números ao redor */
          <div className="relative mx-auto aspect-[4/3] w-full max-w-md">
            <span aria-hidden="true" className="bg-hatch absolute left-[10%] top-[20%] size-[38%] rounded-full" />
            <span aria-hidden="true" className="anim-pop absolute right-[6%] top-[6%] size-[54%] rounded-full bg-mint-200/80" />
            <span aria-hidden="true" className="anim-pop delay-2 absolute bottom-[8%] left-[34%] size-[28%] rounded-full border border-white bg-white/80 shadow-soft" />
            <Link href="/cobros" className="group absolute left-0 top-0 text-left">
              <span className="block text-2xl font-light sm:text-3xl">
                <Money cents={s.owedCents} locale={locale} />
              </span>
              <span className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground group-hover:text-foreground">
                <span className="size-2 rounded-full bg-vivid" aria-hidden="true" />
                {t("hoy.owedLabel")}
              </span>
              {s.awaitingCents > 0 ? (
                <span className="relative z-10 mt-1 block w-fit rounded-full bg-card/95 px-2 py-0.5 text-xs text-awaiting-confirmation-fg">{t("hoy.awaitingPlus", { amount: fmt(s.awaitingCents) })}</span>
              ) : null}
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
          )}
        </div>
      </section>

      {welcome ? (
        <Notice tone="success" role="status">
          <p className="font-medium">{t("hoy.welcome")}</p>
        </Notice>
      ) : null}
      <PendingSyncNote />
      {s.totalProofs === 0 ? (
        <section aria-labelledby="first-steps" className="anim-rise rounded-3xl border border-ink/[0.06] bg-card p-6 shadow-soft">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="first-steps" className="text-xl font-medium">
              {t("hoy.stepsTitle")}
            </h2>
            <p className="text-sm text-muted-foreground tabular-money">{t("hoy.stepsProgress", { done: stepsDone, total: steps.length })}</p>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t("hoy.stepsLead")}</p>
          <ol className="mt-5 grid gap-3 md:grid-cols-3">
            {steps.map((st, i) => (
              <li key={st.href}>
                <Link
                  href={st.href}
                  className={cn(
                    "flex h-full min-h-20 items-start gap-3 rounded-2xl border px-4 py-4 transition-colors",
                    st.done ? "border-ink/[0.06] bg-mint-50 text-muted-foreground" : "border-ink/10 hover:border-ink/30",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-medium",
                      st.done ? "bg-paid-solid text-paid-solid-fg" : "border border-ink/15 bg-card",
                    )}
                  >
                    {st.done ? <Check aria-hidden="true" className="size-4" /> : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("flex items-center gap-2 font-medium", st.done ? "line-through decoration-ink/30" : "text-foreground")}>
                      <st.icon aria-hidden="true" className="size-4 shrink-0" />
                      {st.title}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{st.desc}</span>
                    {st.done ? <span className="sr-only">{t("hoy.stepDone")}</span> : null}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
      {s.awaitingCount > 0 ? (
        <Link href="/cobros" className="block">
          <Notice tone="awaiting" icon={<Clock />}>
            <p className="font-medium">{t("hoy.awaiting", { count: s.awaitingCount })}</p>
          </Notice>
        </Link>
      ) : null}

      {firstRun ? null : (
      <>
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

      {/* ── Mais gráficos: dois livres e dois do plano completo ── */}
      <section className="grid gap-4 md:grid-cols-2">
        <Card className="anim-rise p-6">
          <p className="text-muted-foreground">{t("hoyCharts.debtorsTitle")}</p>
          {debtors.length ? (
            <HBars
              className="mt-5"
              items={debtors.map((d, i) => ({ key: d.name + i, label: d.name, value: d.owedCents, display: fmt(d.owedCents), tone: "warn", hint: d.oldest ? t("hoyCharts.since", { date: formatDate(d.oldest, locale) }) : undefined }))}
            />
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">{t("hoyCharts.debtorsEmpty")}</p>
          )}
        </Card>
        <Card className="anim-rise p-6">
          <p className="text-muted-foreground">{t("hoyCharts.teamWeekTitle")}</p>
          {teamWeek.length ? (
            <HBars className="mt-5" items={teamWeek.slice(0, 5).map((w) => ({ key: w.id, label: w.name, value: w.pieces, display: t("common.pieces", { count: w.pieces }), tone: "ink" }))} />
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">{t("hoyCharts.teamWeekEmpty")}</p>
          )}
        </Card>
        <PremiumGate unlocked={premium} compact teaser={teaserRevenue}>
          <Card className="h-full p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="inline-flex items-center gap-2 text-muted-foreground">
                {t("hoyCharts.revenueTitle")} <ProBadge />
              </p>
            </div>
            <PairBars
              className="mt-3"
              label={t("hoyCharts.revenueTitle")}
              labels={{ a: t("reports.issued"), b: t("reports.received") }}
              format={fmt}
              data={revenue.map((r) => ({ key: r.month, label: monthLabel(r.month), a: r.issuedCents, b: r.paidCents }))}
            />
          </Card>
        </PremiumGate>
        <PremiumGate unlocked={premium} compact teaser={teaserMonth}>
          <Card className="flex h-full flex-col p-6">
            <p className="inline-flex items-center gap-2 text-muted-foreground">
              {t("hoyCharts.monthTitle")} <ProBadge />
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5">
              {(
                [
                  [t("reports.mBatches"), String(mNums.batches)],
                  [t("reports.mReceived"), fmt(mNums.receivedCents)],
                  [t("reports.mAvgPiece"), fmt(mNums.avgPricePerPieceCents)],
                  [t("reports.mDelivered"), String(mNums.deliveredPieces)],
                ] as [string, string][]
              ).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="mt-0.5 text-2xl font-light tabular-money">{v}</dd>
                </div>
              ))}
            </dl>
            {premium ? (
              <Link href="/relatorios" className="mt-auto inline-flex min-h-11 items-center pt-4 text-sm font-medium underline-offset-4 hover:underline">
                {t("hoyCharts.seeReports")}
              </Link>
            ) : null}
          </Card>
        </PremiumGate>
      </section>

      {/* ── Etapas, idade das cobranças, entregas por semana e formas de pagamento ── */}
      <section className="grid gap-4 md:grid-cols-2">
        <ChartCard quiet title={t("hoyCharts.pipelineTitle")} lead={t("hoyCharts.pipelineLead")}>
          <Segments
            label={t("hoyCharts.pipelineTitle")}
            parts={[
              { key: "r", label: t("status.batch.received"), value: pipeline.received, display: String(pipeline.received) },
              { key: "p", label: t("status.batch.in_production"), value: pipeline.inProduction, display: String(pipeline.inProduction) },
              { key: "y", label: t("status.batch.ready"), value: pipeline.ready, display: String(pipeline.ready) },
              { key: "d", label: t("status.batch.delivered"), value: pipeline.delivered, display: String(pipeline.delivered) },
            ]}
          />
        </ChartCard>
        <ChartCard quiet title={t("hoyCharts.agingTitle")} lead={t("hoyCharts.agingLead")}>
          {agingTotal > 0 ? (
            <Donut
              label={t("hoyCharts.agingTitle")}
              center={{ value: fmt(agingTotal), label: t("hoy.owedLabel") }}
              slices={[
                { key: "ok", label: t("cobros.bucketOk"), value: aging.ok, display: fmt(aging.ok) },
                { key: "watch", label: t("cobros.bucketWatch"), value: aging.watch, display: fmt(aging.watch) },
                { key: "late", label: t("cobros.bucketLate"), value: aging.late, display: fmt(aging.late) },
                { key: "critical", label: t("cobros.bucketCritical"), value: aging.critical, display: fmt(aging.critical) },
              ]}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{t("hoyCharts.agingEmpty")}</p>
          )}
        </ChartCard>
        <PremiumGate unlocked={premium} compact teaser={teaserWeekly}>
          <ChartCard quiet className="h-full" title={t("hoyCharts.weeklyTitle")} lead={t("hoyCharts.weeklyLead")} badge={<ProBadge />}>
            <Columns label={t("hoyCharts.weeklyTitle")} data={weekly.map((w) => ({ key: w.week, label: weekLabel(w.week), value: w.pieces, display: t("common.pieces", { count: w.pieces }) }))} />
          </ChartCard>
        </PremiumGate>
        <PremiumGate unlocked={premium} compact>
          <ChartCard quiet className="h-full" title={t("hoyCharts.methodsTitle")} lead={t("hoyCharts.methodsLead")} badge={<ProBadge />}>
            {methodsTotal > 0 ? (
              <Donut
                label={t("hoyCharts.methodsTitle")}
                center={{ value: fmt(methodsTotal), label: t("hoyCharts.methodsCenter") }}
                slices={[
                  { key: "pix", label: t("cobros.methodPix"), value: methods.pix, display: fmt(methods.pix) },
                  { key: "cash", label: t("cobros.methodCash"), value: methods.cash, display: fmt(methods.cash) },
                  { key: "other", label: t("cobros.methodOther"), value: methods.other, display: fmt(methods.other) },
                ]}
              />
            ) : (
              <p className="text-sm text-muted-foreground">{t("hoyCharts.methodsEmpty")}</p>
            )}
          </ChartCard>
        </PremiumGate>
      </section>
      </>
      )}

      {firstRun ? null : (
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
