/** Exportação em Excel (planilhas com a cara do Carretel). Recurso do plano completo. */
import { and, desc, eq, gte } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { batchOperations, batches, clients, deliveryProofs, productionLogs, receivables, settlements, workers } from "@/db/schema";
import { workshopFromRequest } from "@/lib/session";
import { isPremium } from "@/lib/subscription";
import { hitRateLimit } from "@/db/public";
import { addDaysISO, daysBetween, todayISO } from "@/lib/dates";
import { addSheet, addSummary, newWorkbook, workbookResponse, type Tone } from "@/lib/xlsx";
import { clientRanking, monthNumbers, monthlyRevenue, workerProductivity } from "@/server/reports";
import { batchesByMonth } from "@/server/analytics";

const KINDS = ["lotes", "cobros", "clientes", "producao", "acertos", "relatorio"] as const;
type Kind = (typeof KINDS)[number];

export async function GET(req: Request) {
  const ctx = await workshopFromRequest();
  if (!ctx) return new Response(null, { status: 401 });
  if (!isPremium(ctx.workshop.planStatus, ctx.access)) return new Response(null, { status: 402 });
  if (await hitRateLimit(`xlsx:${ctx.workshop.id}`, 30, 3600)) return new Response(null, { status: 429 });

  const url = new URL(req.url);
  const kind = url.searchParams.get("t") as Kind;
  if (!KINDS.includes(kind)) return new Response(null, { status: 400 });
  const locale = url.searchParams.get("l") === "es" ? "es" : "pt-BR";
  const t = await getTranslations({ locale, namespace: "excel" });
  const ts = await getTranslations({ locale, namespace: "status" });
  const tm = await getTranslations({ locale, namespace: "machines" });
  const tdb = ctx.tdb;
  const today = todayISO();
  const stamp = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date());
  const subtitle = t("subtitle", { workshop: ctx.workshop.name, date: stamp });
  const wb = newWorkbook();
  const total = t("total");

  if (kind === "lotes") {
    const rows = await tdb.query((db, s) =>
      db
        .select({ b: batches, client: clients.name })
        .from(batches)
        .leftJoin(clients, and(eq(clients.id, batches.clientId), s(clients)))
        .where(s(batches))
        .orderBy(desc(batches.createdAt))
        .limit(5000),
    );
    addSheet(wb, {
      name: t("sheetBatches"),
      title: t("titleBatches"),
      subtitle,
      totalLabel: total,
      empty: t("empty"),
      columns: [
        { key: "created", header: t("colDate"), kind: "date" },
        { key: "client", header: t("colClient"), width: 26 },
        { key: "ref", header: t("colRef"), width: 16 },
        { key: "color", header: t("colColor"), width: 14 },
        { key: "qty", header: t("colPieces"), kind: "int", total: true },
        { key: "unit", header: t("colUnitPrice"), kind: "money" },
        { key: "total", header: t("colTotal"), kind: "money", total: true },
        { key: "due", header: t("colDue"), kind: "date" },
        { key: "status", header: t("colStatus"), kind: "status", width: 20 },
      ],
      rows: rows.map(({ b, client }) => ({
        created: b.createdAt,
        client: client ?? "—",
        ref: b.reference ?? "",
        color: b.color ?? "",
        qty: b.quantity,
        unit: b.unitPriceCents,
        total: b.totalCents,
        due: b.dueDate,
        status: ts(`batch.${b.status}`),
        _s: b.status,
      })),
      tone: (r) => (r._s === "delivered" || r._s === "closed" ? "good" : r._s === "canceled" ? "bad" : r._s === "ready" ? "warn" : "neutral"),
    });
  }

  if (kind === "cobros") {
    const rows = await tdb.query((db, s) =>
      db
        .select({ r: receivables, client: clients.name, ref: batches.reference })
        .from(receivables)
        .innerJoin(deliveryProofs, and(eq(deliveryProofs.id, receivables.deliveryProofId), s(deliveryProofs)))
        .innerJoin(batches, and(eq(batches.id, deliveryProofs.batchId), s(batches)))
        .leftJoin(clients, and(eq(clients.id, receivables.clientId), s(clients)))
        .where(s(receivables))
        .orderBy(desc(receivables.issuedOn))
        .limit(5000),
    );
    const tone = (st: string, days: number): Tone => (st === "paid" ? "good" : st === "written_off" ? "bad" : st === "awaiting_confirmation" ? "warn" : days > 15 ? "bad" : "neutral");
    addSheet(wb, {
      name: t("sheetReceivables"),
      title: t("titleReceivables"),
      subtitle,
      totalLabel: total,
      empty: t("empty"),
      columns: [
        { key: "issued", header: t("colDelivered"), kind: "date" },
        { key: "client", header: t("colClient"), width: 26 },
        { key: "ref", header: t("colRef"), width: 16 },
        { key: "amount", header: t("colAmount"), kind: "money", total: true },
        { key: "paid", header: t("colPaid"), kind: "money", total: true },
        { key: "open", header: t("colOpen"), kind: "money", total: true },
        { key: "days", header: t("colDays"), kind: "int" },
        { key: "status", header: t("colStatus"), kind: "status", width: 22 },
      ],
      rows: rows.map(({ r, client, ref }) => {
        const open = r.status === "paid" || r.status === "written_off" ? 0 : r.amountCents - r.paidCents;
        const days = daysBetween(r.issuedOn, today);
        return { issued: r.issuedOn, client: client ?? "—", ref: ref ?? "", amount: r.amountCents, paid: r.paidCents, open, days: open ? days : null, status: ts(`receivable.${r.status}`), _t: tone(r.status, days) };
      }),
      tone: (r) => r._t as Tone,
    });
  }

  if (kind === "clientes") {
    const [rank, list] = await Promise.all([clientRanking(tdb), tdb.select(clients, undefined)]);
    const rm = new Map(rank.map((r) => [r.id, r]));
    addSheet(wb, {
      name: t("sheetClients"),
      title: t("titleClients"),
      subtitle,
      totalLabel: total,
      empty: t("empty"),
      columns: [
        { key: "name", header: t("colClient"), width: 28 },
        { key: "phone", header: t("colPhone"), width: 18 },
        { key: "batches", header: t("colBatches"), kind: "int", total: true },
        { key: "volume", header: t("colVolume"), kind: "money", total: true },
        { key: "owed", header: t("colOwes"), kind: "money", total: true },
        { key: "days", header: t("colAvgDays"), kind: "int" },
      ],
      rows: list
        .filter((c) => !c.anonymizedAt)
        .map((c) => {
          const r = rm.get(c.id);
          return { name: c.name, phone: c.phoneE164 ?? "", batches: r?.batches ?? 0, volume: r?.volumeCents ?? 0, owed: r?.owedCents ?? 0, days: r?.avgDaysToPay ?? null };
        })
        .sort((a, b) => (b.volume as number) - (a.volume as number)),
      tone: (r) => ((r.owed as number) > 0 ? "warn" : "neutral"),
    });
  }

  if (kind === "producao") {
    const since = addDaysISO(today, -89);
    const rows = await tdb.query((db, s) =>
      db
        .select({ l: productionLogs, worker: workers.name, ref: batches.reference, machine: batchOperations.machine })
        .from(productionLogs)
        .innerJoin(workers, and(eq(workers.id, productionLogs.workerId), s(workers)))
        .innerJoin(batches, and(eq(batches.id, productionLogs.batchId), s(batches)))
        .leftJoin(batchOperations, and(eq(batchOperations.id, productionLogs.operationId), s(batchOperations)))
        .where(and(s(productionLogs), gte(productionLogs.workDate, since)))
        .orderBy(desc(productionLogs.workDate))
        .limit(10000),
    );
    addSheet(wb, {
      name: t("sheetProduction"),
      title: t("titleProduction"),
      subtitle: `${subtitle} · ${t("last90")}`,
      totalLabel: total,
      empty: t("empty"),
      columns: [
        { key: "date", header: t("colDate"), kind: "date" },
        { key: "worker", header: t("colWorker"), width: 22 },
        { key: "ref", header: t("colRef"), width: 16 },
        { key: "machine", header: t("colMachine"), width: 18 },
        { key: "pieces", header: t("colPieces"), kind: "int", total: true },
        { key: "hours", header: t("colHours"), kind: "decimal" },
        { key: "amount", header: t("colToPay"), kind: "money", total: true },
      ],
      rows: rows.map(({ l, worker, ref, machine }) => ({
        date: l.workDate,
        worker,
        ref: ref ?? "",
        machine: machine ? tm(machine) : "",
        pieces: l.pieces,
        hours: l.hours ? Number(l.hours) : null,
        amount: l.amountCents,
      })),
    });
  }

  if (kind === "acertos") {
    const rows = await tdb.query((db, s) =>
      db
        .select({ st: settlements, worker: workers.name })
        .from(settlements)
        .innerJoin(workers, and(eq(workers.id, settlements.workerId), s(workers)))
        .where(s(settlements))
        .orderBy(desc(settlements.periodEnd))
        .limit(5000),
    );
    addSheet(wb, {
      name: t("sheetSettlements"),
      title: t("titleSettlements"),
      subtitle,
      totalLabel: total,
      empty: t("empty"),
      columns: [
        { key: "start", header: t("colFrom"), kind: "date" },
        { key: "end", header: t("colTo"), kind: "date" },
        { key: "worker", header: t("colWorker"), width: 22 },
        { key: "days", header: t("colDaysWorked"), kind: "int" },
        { key: "gross", header: t("colGross"), kind: "money", total: true },
        { key: "adv", header: t("colAdvances"), kind: "money", total: true },
        { key: "adj", header: t("colAdjustments"), kind: "money", total: true },
        { key: "net", header: t("colNet"), kind: "money", total: true },
        { key: "status", header: t("colStatus"), kind: "status", width: 16 },
      ],
      rows: rows.map(({ st, worker }) => ({
        start: st.periodStart,
        end: st.periodEnd,
        worker,
        days: st.daysWorked,
        gross: st.grossCents,
        adv: st.advancesCents,
        adj: st.adjustmentsCents,
        net: st.netCents,
        status: ts(`settlement.${st.status}`),
        _s: st.status,
      })),
      tone: (r) => (r._s === "paid" ? "good" : "warn"),
    });
  }

  if (kind === "relatorio") {
    const [month, revenue, byMonth, rank, team] = await Promise.all([monthNumbers(tdb), monthlyRevenue(tdb, 12), batchesByMonth(tdb, 12), clientRanking(tdb), workerProductivity(tdb, 30)]);
    const monthName = (k: string) => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${k}-15T12:00:00Z`));
    addSummary(wb, {
      name: t("sheetSummary"),
      title: t("titleSummary"),
      subtitle,
      items: [
        { label: t("mBatches"), value: month.batches, kind: "int" },
        { label: t("mReceived"), value: month.receivedCents, kind: "money" },
        { label: t("mAvgPiece"), value: month.avgPricePerPieceCents, kind: "money" },
        { label: t("mAvgTicket"), value: month.avgTicketCents, kind: "money" },
        { label: t("mDelivered"), value: month.deliveredPieces, kind: "int" },
        { label: t("mDeliveredValue"), value: month.deliveredCents, kind: "money" },
      ],
    });
    const bm = new Map(byMonth.map((m) => [m.month, m]));
    addSheet(wb, {
      name: t("sheetMonths"),
      title: t("titleMonths"),
      subtitle,
      totalLabel: total,
      columns: [
        { key: "month", header: t("colMonth"), width: 20 },
        { key: "batches", header: t("colBatches"), kind: "int", total: true },
        { key: "inPieces", header: t("colPiecesIn"), kind: "int", total: true },
        { key: "outPieces", header: t("colPiecesOut"), kind: "int", total: true },
        { key: "issued", header: t("colIssued"), kind: "money", total: true },
        { key: "paid", header: t("colReceived"), kind: "money", total: true },
        { key: "ticket", header: t("colTicket"), kind: "money" },
        { key: "piece", header: t("colAvgPiece"), kind: "money" },
      ],
      rows: revenue.map((r) => {
        const m = bm.get(r.month);
        return { month: monthName(r.month), batches: m?.batches ?? 0, inPieces: m?.receivedPieces ?? 0, outPieces: m?.deliveredPieces ?? 0, issued: r.issuedCents, paid: r.paidCents, ticket: m?.avgTicketCents ?? 0, piece: m?.avgPieceCents ?? 0 };
      }),
    });
    addSheet(wb, {
      name: t("sheetClients"),
      title: t("titleClients"),
      subtitle,
      totalLabel: total,
      empty: t("empty"),
      columns: [
        { key: "name", header: t("colClient"), width: 28 },
        { key: "batches", header: t("colBatches"), kind: "int", total: true },
        { key: "volume", header: t("colVolume"), kind: "money", total: true },
        { key: "owed", header: t("colOwes"), kind: "money", total: true },
        { key: "days", header: t("colAvgDays"), kind: "int" },
      ],
      rows: rank.map((c) => ({ name: c.name, batches: c.batches, volume: c.volumeCents, owed: c.owedCents, days: c.avgDaysToPay })),
      tone: (r) => ((r.owed as number) > 0 ? "warn" : "neutral"),
    });
    addSheet(wb, {
      name: t("sheetTeam"),
      title: t("titleTeam"),
      subtitle: `${subtitle} · ${t("last30")}`,
      totalLabel: total,
      empty: t("empty"),
      columns: [
        { key: "name", header: t("colWorker"), width: 24 },
        { key: "days", header: t("colDaysWorked"), kind: "int" },
        { key: "pieces", header: t("colPieces"), kind: "int", total: true },
        { key: "perDay", header: t("colPerDay"), kind: "int" },
        { key: "cents", header: t("colToPay"), kind: "money", total: true },
      ],
      rows: team.map((w) => ({ name: w.name, days: w.days, pieces: w.pieces, perDay: w.perDay, cents: w.cents })),
    });
  }

  const slug = ctx.workshop.name
    .normalize("NFD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 30);
  return workbookResponse(wb, `carretel-${kind}-${slug || "taller"}-${today}.xlsx`);
}

