import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireWorkshop } from "@/lib/session";
import { isPremium } from "@/lib/subscription";
import { clientRanking, monthNumbers, monthlyRevenue, workerProductivity } from "@/server/reports";
import { batchesByMonth, monthKeys, onTimeDelivery, payrollWeekly, productionByMachine, productionDaily, proofOutcomes, weekKeys, weekdayAverages } from "@/server/analytics";
import { PageHeader } from "@/components/app/page-header";
import { PairBars, HBars } from "@/components/app/report-charts";
import { ChartCard, Columns, Donut, Heatmap, LineArea, Segments } from "@/components/app/viz";
import { PremiumGate, ProBadge } from "@/components/app/premium";
import { ExcelButton } from "@/components/app/excel-button";
import { formatBRL } from "@/lib/money";
import { addDaysISO, todayISO } from "@/lib/dates";

export const dynamic = "force-dynamic";

/* Dados de EXEMPLO mostrados (desfocados) para quem ainda não assina — nunca são os dados reais. */
function sample() {
  const months = monthKeys(12);
  const wave = (base: number, amp: number, i: number) => Math.round(base + amp * Math.sin(i / 1.7) + i * base * 0.03);
  const byMonth = months.map((m, i) => {
    const batches = wave(9, 3, i);
    const qty = batches * 280;
    const total = qty * wave(300, 25, i);
    return { month: m, batches, receivedPieces: qty, deliveredPieces: Math.round(qty * 0.92), totalCents: total, avgTicketCents: Math.round(total / batches), avgPieceCents: Math.round(total / qty) };
  });
  const daily = Array.from({ length: 84 }, (_, i) => {
    const day = addDaysISO(todayISO(), -83 + i);
    const dow = new Date(day + "T12:00:00Z").getUTCDay();
    return { day, pieces: dow === 0 ? 0 : dow === 6 ? 140 : 180 + ((i * 37) % 120) };
  });
  return {
    revenue: months.map((m, i) => ({ month: m, issuedCents: byMonth[i]!.totalCents, paidCents: Math.round(byMonth[i]!.totalCents * 0.86) })),
    byMonth,
    clients: [
      { id: "a", name: "Confecções Lua", volumeCents: 1240000, owedCents: 0, avgDaysToPay: 6, batches: 9 },
      { id: "b", name: "Bruma Modas", volumeCents: 860000, owedCents: 120000, avgDaysToPay: 12, batches: 6 },
      { id: "c", name: "Moda Centro", volumeCents: 540000, owedCents: 90000, avgDaysToPay: 21, batches: 4 },
      { id: "d", name: "Ateliê Sol", volumeCents: 310000, owedCents: 0, avgDaysToPay: 9, batches: 3 },
      { id: "e", name: "Brás Jeans", volumeCents: 220000, owedCents: 40000, avgDaysToPay: 27, batches: 2 },
    ],
    team: [
      { id: "a", name: "Rosa", pieces: 1840, perDay: 92, cents: 0, days: 20 },
      { id: "b", name: "Juan", pieces: 1520, perDay: 76, cents: 0, days: 20 },
      { id: "c", name: "Ana", pieces: 1210, perDay: 67, cents: 0, days: 18 },
    ],
    month: { batches: 11, receivedCents: 1180000, avgPricePerPieceCents: 310, avgTicketCents: 107000, deliveredPieces: 3200, deliveredCents: 990000 },
    machines: [
      { machine: "recta" as const, pieces: 2400 },
      { machine: "overlock" as const, pieces: 1900 },
      { machine: "collareta" as const, pieces: 900 },
      { machine: "other" as const, pieces: 400 },
    ],
    daily,
    payroll: weekKeys(8).map((w, i) => ({ week: w, productionCents: 380000 + ((i * 53000) % 160000), advancesCents: 60000 + ((i * 21000) % 70000) })),
    proofs: { confirmed: 34, awaiting: 5, disputed: 2, revoked: 1 },
    onTime: { onTime: 27, late: 4 },
  };
}

export default async function RelatoriosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ctx = await requireWorkshop();
  const t = await getTranslations("reports");
  const tAll = await getTranslations();
  const premium = isPremium(ctx.workshop.planStatus, ctx.access);

  const d = premium
    ? await (async () => {
        const [revenue, byMonth, clients, team, month, machines, daily, payroll, proofs, onTime] = await Promise.all([
          monthlyRevenue(ctx.tdb, 12),
          batchesByMonth(ctx.tdb, 12),
          clientRanking(ctx.tdb),
          workerProductivity(ctx.tdb, 30),
          monthNumbers(ctx.tdb),
          productionByMachine(ctx.tdb, 30),
          productionDaily(ctx.tdb, 84),
          payrollWeekly(ctx.tdb, 8),
          proofOutcomes(ctx.tdb),
          onTimeDelivery(ctx.tdb),
        ]);
        return { revenue, byMonth, clients, team, month, machines, daily, payroll, proofs, onTime };
      })()
    : sample();

  const f = (c: number) => formatBRL(c, locale);
  const real = premium ? null : await monthNumbers(ctx.tdb);
  const teaser = real && real.deliveredPieces > 0 ? t("teaser", { count: real.deliveredPieces, amount: f(real.deliveredCents) }) : null;
  const monthLabel = (k: string) => new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(new Date(`${k}-15T12:00:00Z`)).replace(".", "");
  const dayLabel = (iso: string) => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(new Date(iso + "T12:00:00Z"));
  const weekdayNames = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2026, 0, 5 + i, 12))).replace(".", ""),
  );
  const empty = premium && d.revenue.every((r) => !r.issuedCents && !r.paidCents) && d.clients.length === 0 && d.team.length === 0;

  const monthStats: [string, string][] = [
    [t("mBatches"), String(d.month.batches)],
    [t("mReceived"), f(d.month.receivedCents)],
    [t("mAvgPiece"), f(d.month.avgPricePerPieceCents)],
    [t("mAvgTicket"), f(d.month.avgTicketCents)],
    [t("mDelivered"), String(d.month.deliveredPieces)],
    [t("mDeliveredValue"), f(d.month.deliveredCents)],
  ];

  // participação: 4 maiores + "outros" (nunca mais de 5 cores)
  const top = d.clients.slice(0, 4);
  const rest = d.clients.slice(4).reduce((a, c) => a + c.volumeCents, 0);
  const shareSlices = [
    ...top.map((c) => ({ key: c.id, label: c.name, value: c.volumeCents, display: f(c.volumeCents) })),
    ...(rest > 0 ? [{ key: "rest", label: t("others"), value: rest, display: f(rest) }] : []),
  ];
  const shareTotal = shareSlices.reduce((a, s) => a + s.value, 0);
  const payers = d.clients.filter((c) => c.avgDaysToPay !== null).sort((a, b) => (b.avgDaysToPay ?? 0) - (a.avgDaysToPay ?? 0));
  const weekday = weekdayAverages(d.daily);
  const proofTotal = d.proofs.confirmed + d.proofs.awaiting + d.proofs.disputed + d.proofs.revoked;
  const last6 = d.byMonth.slice(-6);
  const issuedSum = d.revenue.reduce((a, r) => a + r.issuedCents, 0);

  const content = (
    <div className="space-y-4">
      {empty ? <p className="rounded-3xl border border-dashed border-ink/15 px-6 py-8 text-center text-muted-foreground">{t("empty")}</p> : null}

      <ChartCard title={t("monthTitle")}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
          {monthStats.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="mt-1 text-2xl font-light tabular-money">{v}</dd>
            </div>
          ))}
        </dl>
      </ChartCard>

      {/* ── Dinheiro ── */}
      <h2 className="pt-2 text-lg font-medium">{t("groupMoney")}</h2>
      <ChartCard title={t("trendTitle")} lead={t("trendLead", { total: f(issuedSum) })}>
        <LineArea label={t("trendTitle")} data={d.revenue.map((r) => ({ key: r.month, label: monthLabel(r.month), value: r.issuedCents, display: f(r.issuedCents) }))} />
      </ChartCard>
      <ChartCard title={t("revenueTitle")} lead={t("revenueLead")}>
        <PairBars
          label={t("revenueTitle")}
          labels={{ a: t("issued"), b: t("received") }}
          format={f}
          data={d.revenue.slice(-6).map((r) => ({ key: r.month, label: monthLabel(r.month), a: r.issuedCents, b: r.paidCents }))}
        />
      </ChartCard>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t("ticketTitle")} lead={t("ticketLead")}>
          <LineArea label={t("ticketTitle")} data={d.byMonth.map((m) => ({ key: m.month, label: monthLabel(m.month), value: m.avgTicketCents, display: f(m.avgTicketCents) }))} />
        </ChartCard>
        <ChartCard title={t("pieceTitle")} lead={t("pieceLead")}>
          <LineArea label={t("pieceTitle")} data={d.byMonth.map((m) => ({ key: m.month, label: monthLabel(m.month), value: m.avgPieceCents, display: f(m.avgPieceCents) }))} />
        </ChartCard>
      </div>

      {/* ── Clientes ── */}
      <h2 className="pt-2 text-lg font-medium">{t("groupClients")}</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t("shareTitle")} lead={t("shareLead")}>
          {shareTotal > 0 ? <Donut label={t("shareTitle")} slices={shareSlices} center={{ value: String(d.clients.length), label: t("clientsCount") }} /> : <p className="text-sm text-muted-foreground">{t("noData")}</p>}
        </ChartCard>
        <ChartCard title={t("clientsTitle")} lead={t("clientsLead")}>
          <HBars
            items={d.clients.slice(0, 6).map((c) => ({
              key: c.id,
              label: c.name,
              value: c.volumeCents,
              display: f(c.volumeCents),
              tone: "vivid",
              hint: c.owedCents > 0 ? t("owes", { amount: f(c.owedCents) }) : undefined,
            }))}
          />
        </ChartCard>
        <ChartCard title={t("payDaysTitle")} lead={t("payDaysLead")}>
          {payers.length ? (
            <HBars
              items={payers.slice(0, 6).map((c) => ({
                key: c.id,
                label: c.name,
                value: c.avgDaysToPay ?? 0,
                display: t("paysIn", { days: c.avgDaysToPay ?? 0 }),
                tone: (c.avgDaysToPay ?? 0) > 15 ? "warn" : "ink",
              }))}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{t("noPayHistory")}</p>
          )}
        </ChartCard>
        <ChartCard title={t("proofsTitle")} lead={t("proofsLead")}>
          {proofTotal > 0 ? (
            <Donut
              label={t("proofsTitle")}
              center={{ value: String(proofTotal), label: t("proofsCenter") }}
              slices={[
                { key: "c", label: t("proofConfirmed"), value: d.proofs.confirmed, display: String(d.proofs.confirmed) },
                { key: "a", label: t("proofAwaiting"), value: d.proofs.awaiting, display: String(d.proofs.awaiting) },
                { key: "d", label: t("proofDisputed"), value: d.proofs.disputed, display: String(d.proofs.disputed) },
                { key: "r", label: t("proofRevoked"), value: d.proofs.revoked, display: String(d.proofs.revoked) },
              ]}
            />
          ) : (
            <p className="text-sm text-muted-foreground">{t("noData")}</p>
          )}
        </ChartCard>
      </div>

      {/* ── Produção ── */}
      <h2 className="pt-2 text-lg font-medium">{t("groupProduction")}</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t("flowTitle")} lead={t("flowLead")}>
          <PairBars
            label={t("flowTitle")}
            labels={{ a: t("piecesIn"), b: t("piecesOut") }}
            format={(v) => tAll("common.pieces", { count: v })}
            data={last6.map((m) => ({ key: m.month, label: monthLabel(m.month), a: m.receivedPieces, b: m.deliveredPieces }))}
          />
        </ChartCard>
        <ChartCard title={t("onTimeTitle")} lead={t("onTimeLead")}>
          <Segments
            label={t("onTimeTitle")}
            parts={[
              { key: "on", label: t("onTime"), value: d.onTime.onTime, display: String(d.onTime.onTime), color: "var(--chart-1)" },
              { key: "late", label: t("late"), value: d.onTime.late, display: String(d.onTime.late), color: "var(--chart-5)" },
            ]}
          />
        </ChartCard>
        <ChartCard title={t("weekdayTitle")} lead={t("weekdayLead")}>
          <Columns label={t("weekdayTitle")} highlight="max" data={weekday.map((v, i) => ({ key: String(i), label: weekdayNames[i]!, value: v, display: tAll("common.pieces", { count: v }) }))} />
        </ChartCard>
        <ChartCard title={t("machineTitle")} lead={t("machineLead")}>
          {d.machines.length ? (
            <HBars items={d.machines.map((m) => ({ key: m.machine, label: tAll(`machines.${m.machine}`), value: m.pieces, display: tAll("common.pieces", { count: m.pieces }), tone: "ink" }))} />
          ) : (
            <p className="text-sm text-muted-foreground">{t("noData")}</p>
          )}
        </ChartCard>
      </div>
      <ChartCard title={t("calendarTitle")} lead={t("calendarLead")}>
        <Heatmap
          label={t("calendarTitle")}
          weekdayLabels={weekdayNames}
          days={d.daily.map((x) => ({ day: x.day, value: x.pieces }))}
          format={(v, day) => `${dayLabel(day)}: ${tAll("common.pieces", { count: v })}`}
          legend={{ less: t("less"), more: t("more") }}
        />
      </ChartCard>

      {/* ── Equipe ── */}
      <h2 className="pt-2 text-lg font-medium">{t("groupTeam")}</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t("teamTitle")} lead={t("teamLead")}>
          <HBars items={d.team.slice(0, 8).map((w) => ({ key: w.id, label: w.name, value: w.pieces, display: String(w.pieces), hint: t("perDay", { n: w.perDay }), tone: "ink" }))} />
        </ChartCard>
        <ChartCard title={t("payrollTitle")} lead={t("payrollLead")}>
          <PairBars
            label={t("payrollTitle")}
            labels={{ a: t("advances"), b: t("production") }}
            format={f}
            data={d.payroll.map((w) => ({ key: w.week, label: dayLabel(w.week), a: w.advancesCents, b: w.productionCents }))}
          />
        </ChartCard>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("lead")} />
      <div className="-mt-2 flex flex-wrap items-center gap-3">
        <ProBadge />
        <ExcelButton kind="relatorio" premium={premium} />
      </div>
      <PremiumGate unlocked={premium} teaser={teaser}>
        {content}
      </PremiumGate>
    </div>
  );
}
