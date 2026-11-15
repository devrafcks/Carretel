import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireWorkshop } from "@/lib/session";
import { ExcelButton } from "@/components/app/excel-button";
import { isPremium } from "@/lib/subscription";
import { productionBoard } from "@/server/queries";
import { settlementPreviewCore } from "@/server/core";
import { settlementPeriod } from "@/lib/settlement";
import { todayUTCDate, formatDate } from "@/lib/dates";
import { PageHeader } from "@/components/app/page-header";
import { ProductionToday, SettlementPanel, TeamPanel } from "./production-client";
import { ProductionTabs } from "./production-tabs";
import { appUrl } from "@/config/brand";
import { currentLegalParam } from "@/db/public";

const TABS = ["hoy", "acerto", "equipo"] as const;

export default async function ProduccionPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { locale } = await params;
  const { tab: rawTab } = await searchParams;
  setRequestLocale(locale);
  const tab = (TABS as readonly string[]).includes(rawTab ?? "") ? (rawTab as (typeof TABS)[number]) : "hoy";
  const ctx = await requireWorkshop();
  const t = await getTranslations();
  const board = await productionBoard(ctx.tdb);
  const period = settlementPeriod(todayUTCDate());

  const [previews, minWage] = await Promise.all([
    Promise.all(
          board.workers
            .filter((w) => w.pendingCents > 0 || w.advancesCents > 0)
            .map(async (w) => {
              const p = await settlementPreviewCore(ctx, w.worker.id, period);
              return {
                workerId: w.worker.id,
                name: w.worker.name,
                phone: w.worker.phoneE164,
                gross: p.result.grossCents,
                advances: p.result.advancesCents,
                net: p.result.netCents,
                daysWorked: p.result.daysWorked,
                perDay: p.result.perDayCents,
                belowMinWage: p.result.belowMinWage,
                excessHours: p.result.excessHours,
                pieces: p.result.piecesTotal,
              };
            }),
    ),
    currentLegalParam("minimum_wage_monthly_cents", period.end),
  ]);

  const labels: Record<(typeof TABS)[number], string> = {
    hoy: t("production.tabToday"),
    acerto: t("production.tabSettle"),
    equipo: t("production.tabTeam"),
  };

  return (
    <div>
      <PageHeader tone="terracota" illustration="/illustrations/acerto.svg" title={t("production.title")} subtitle={t("production.settlePeriod", { start: formatDate(period.start, locale), end: formatDate(period.end, locale) })} />
      <div className="-mt-2 mb-4 flex flex-wrap gap-2">
        <ExcelButton kind="producao" premium={isPremium(ctx.workshop.planStatus, ctx.access)} />
        <ExcelButton kind="acertos" premium={isPremium(ctx.workshop.planStatus, ctx.access)} />
      </div>
      <ProductionTabs
        initial={tab}
        labels={labels}
        ariaLabel={t("production.title")}
        panels={{
          hoy: (
            <ProductionToday
              canWrite={ctx.access.canWrite}
              workers={board.workers.map((w) => ({ id: w.worker.id, name: w.worker.name, todayPieces: w.todayPieces, pendingCents: w.pendingCents, advancesCents: w.advancesCents }))}
              batches={board.openBatches.map((b) => ({ id: b.batch.id, label: `${b.clientName ?? t("common.noClient")} · ${b.batch.reference ? `${t("common.reference")} ${b.batch.reference}` : t("batch.noRef")}` }))}
              ops={board.ops.map((o) => ({ id: o.id, batchId: o.batchId, machine: o.machine, rate: o.pieceRateCents }))}
            />
          ),
          acerto: (
            <SettlementPanel
              canWrite={ctx.access.canWrite}
              baseUrl={appUrl()}
              periodLabel={t("production.settlePeriod", { start: formatDate(period.start, locale), end: formatDate(period.end, locale) })}
              period={period}
              minWageConfigured={Boolean(minWage)}
              previews={previews}
              settlements={board.recentSettlements.map((s) => ({
                id: s.settlement.id,
                workerName: s.workerName,
                workerPhone: board.workers.find((w) => w.worker.id === s.settlement.workerId)?.worker.phoneE164 ?? null,
                status: s.settlement.status,
                gross: s.settlement.grossCents,
                advances: s.settlement.advancesCents,
                net: s.settlement.netCents,
                token: s.settlement.publicToken,
                isAdjustment: Boolean(s.settlement.adjustsSettlementId),
                belowMinWage: s.settlement.belowMinWageFlag,
                periodEnd: s.settlement.periodEnd,
              }))}
            />
          ),
          equipo: (
            <TeamPanel
              canWrite={ctx.access.canWrite}
              workers={board.workers.map((w) => ({
                id: w.worker.id,
                name: w.worker.name,
                phone: w.worker.phoneE164,
                isEmployee: w.worker.isEmployee,
                docLast3: w.worker.docLast3,
              }))}
            />
          ),
        }}
      />
    </div>
  );
}
