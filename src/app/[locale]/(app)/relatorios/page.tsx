import { getTranslations, setRequestLocale } from "next-intl/server";
import { Download } from "@/components/icons";
import { requireWorkshop } from "@/lib/session";
import { isPremium } from "@/lib/subscription";
import { clientRanking, monthNumbers, monthlyRevenue, workerProductivity } from "@/server/reports";
import { PageHeader } from "@/components/app/page-header";
import { PairBars, HBars } from "@/components/app/report-charts";
import { PremiumGate, ProBadge } from "@/components/app/premium";
import { formatBRL } from "@/lib/money";

export const dynamic = "force-dynamic";

/* Dados de EXEMPLO mostrados (desfocados) para quem ainda não assina — nunca são os dados reais. */
const SAMPLE = {
  revenue: [3, 4, 5, 6, 7, 8].map((m, i) => ({ month: `2026-${String(m + 3).padStart(2, "0")}`, issuedCents: [520000, 610000, 480000, 720000, 690000, 810000][i]!, paidCents: [480000, 540000, 470000, 610000, 650000, 590000][i]! })),
  clients: [
    { id: "a", name: "Confecções Lua", volumeCents: 1240000, owedCents: 0, avgDaysToPay: 6, batches: 9 },
    { id: "b", name: "Bruma Modas", volumeCents: 860000, owedCents: 120000, avgDaysToPay: 12, batches: 6 },
    { id: "c", name: "Moda Centro", volumeCents: 540000, owedCents: 90000, avgDaysToPay: 21, batches: 4 },
  ],
  team: [
    { id: "a", name: "Rosa", pieces: 1840, perDay: 92, cents: 0, days: 20 },
    { id: "b", name: "Juan", pieces: 1520, perDay: 76, cents: 0, days: 20 },
    { id: "c", name: "Ana", pieces: 1210, perDay: 67, cents: 0, days: 18 },
  ],
  month: { batches: 11, receivedCents: 1180000, avgPricePerPieceCents: 310, avgTicketCents: 107000, deliveredPieces: 3200, deliveredCents: 990000 },
};

export default async function RelatoriosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ctx = await requireWorkshop();
  const t = await getTranslations("reports");
  const premium = isPremium(ctx.workshop.planStatus, ctx.access);

  const [revenue, clientsRank, team, month] = premium
    ? await Promise.all([monthlyRevenue(ctx.tdb, 6), clientRanking(ctx.tdb), workerProductivity(ctx.tdb, 30), monthNumbers(ctx.tdb)])
    : [SAMPLE.revenue, SAMPLE.clients, SAMPLE.team, SAMPLE.month];

  const f = (c: number) => formatBRL(c, locale);
  const real = premium ? null : await monthNumbers(ctx.tdb);
  const teaser = real && real.deliveredPieces > 0 ? t("teaser", { count: real.deliveredPieces, amount: f(real.deliveredCents) }) : null;
  const monthLabel = (k: string) => new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(new Date(`${k}-15T12:00:00Z`)).replace(".", "");
  const card = "rounded-3xl border border-ink/[0.06] bg-card p-6 shadow-soft";
  const empty = premium && revenue.every((r) => !r.issuedCents && !r.paidCents) && clientsRank.length === 0 && team.length === 0;

  const monthStats: [string, string][] = [
    [t("mBatches"), String(month.batches)],
    [t("mReceived"), f(month.receivedCents)],
    [t("mAvgPiece"), f(month.avgPricePerPieceCents)],
    [t("mAvgTicket"), f(month.avgTicketCents)],
    [t("mDelivered"), String(month.deliveredPieces)],
    [t("mDeliveredValue"), f(month.deliveredCents)],
  ];

  const content = (
    <div className="space-y-4">
      {empty ? <p className="rounded-3xl border border-dashed border-ink/15 px-6 py-8 text-center text-muted-foreground">{t("empty")}</p> : null}

      <section className={card}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-medium">{t("monthTitle")}</h2>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
          {monthStats.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="mt-1 text-2xl font-light tabular-money">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={card}>
        <h2 className="font-medium">{t("revenueTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("revenueLead")}</p>
        <PairBars
          className="mt-4"
          label={t("revenueTitle")}
          labels={{ a: t("issued"), b: t("received") }}
          format={f}
          data={revenue.map((r) => ({ key: r.month, label: monthLabel(r.month), a: r.issuedCents, b: r.paidCents }))}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={card}>
          <h2 className="font-medium">{t("clientsTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("clientsLead")}</p>
          <HBars
            className="mt-5"
            items={clientsRank.slice(0, 6).map((c) => ({
              key: c.id,
              label: c.name,
              value: c.volumeCents,
              display: f(c.volumeCents),
              tone: c.avgDaysToPay !== null && c.avgDaysToPay > 15 ? "warn" : "vivid",
              hint: [c.avgDaysToPay !== null ? t("paysIn", { days: c.avgDaysToPay }) : t("noPayHistory"), c.owedCents > 0 ? t("owes", { amount: f(c.owedCents) }) : null].filter(Boolean).join(" · "),
            }))}
          />
        </section>
        <section className={card}>
          <h2 className="font-medium">{t("teamTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("teamLead")}</p>
          <HBars className="mt-5" items={team.slice(0, 8).map((w) => ({ key: w.id, label: w.name, value: w.pieces, display: String(w.pieces), hint: t("perDay", { n: w.perDay }), tone: "ink" }))} />
        </section>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title={t("title")} subtitle={t("lead")} />
      </div>
      <div className="-mt-2 flex flex-wrap items-center gap-3">
        <ProBadge />
        {premium ? (
          <a href="/api/reports/export" download className="inline-flex min-h-10 items-center gap-2 rounded-full border border-ink/15 px-4 text-sm font-medium hover:border-ink/40">
            <Download aria-hidden="true" className="size-4" />
            {t("export")}
          </a>
        ) : null}
      </div>
      <PremiumGate unlocked={premium} teaser={teaser}>{content}</PremiumGate>
    </div>
  );
}
