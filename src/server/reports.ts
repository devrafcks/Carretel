/** Relatórios do plano completo (sempre via tenantDb, só dados do próprio taller). */
import "server-only";
import { and, eq, gte, inArray, isNull, ne, sql } from "drizzle-orm";
import { batches, clients, payments, productionLogs, receivables, workers, deliveryProofs } from "@/db/schema";
import type { TenantDb } from "@/db/tenant";
import { todayISO } from "@/lib/dates";

const OPEN = ["open", "partially_paid", "awaiting_confirmation", "disputed"] as const;

function monthKeys(n: number): string[] {
  const [y, m] = todayISO().split("-").map(Number) as [number, number];
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (n - 1 - i), 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

/** Faturado (comprovantes emitidos) x recebido (pagamentos) por mês. */
export async function monthlyRevenue(tdb: TenantDb, months = 6) {
  const keys = monthKeys(months);
  const since = `${keys[0]}-01`;
  const [issued, paid] = await Promise.all([
    tdb.query((db, s) =>
      db
        .select({ m: sql<string>`to_char(${receivables.issuedOn}, 'YYYY-MM')`, v: sql<number>`coalesce(sum(${receivables.amountCents}),0)::bigint` })
        .from(receivables)
        .where(and(s(receivables), gte(receivables.issuedOn, since), ne(receivables.status, "written_off")))
        .groupBy(sql`1`),
    ),
    tdb.query((db, s) =>
      db
        .select({ m: sql<string>`to_char(${payments.paidOn}, 'YYYY-MM')`, v: sql<number>`coalesce(sum(${payments.amountCents}),0)::bigint` })
        .from(payments)
        .where(and(s(payments), gte(payments.paidOn, since)))
        .groupBy(sql`1`),
    ),
  ]);
  const im = new Map(issued.map((r) => [r.m, Number(r.v)]));
  const pm = new Map(paid.map((r) => [r.m, Number(r.v)]));
  return keys.map((k) => ({ month: k, issuedCents: im.get(k) ?? 0, paidCents: pm.get(k) ?? 0 }));
}

/** Clientes: volume trabalhado, quanto devem e em quantos dias costumam pagar. */
export async function clientRanking(tdb: TenantDb) {
  const [vol, owed, pay] = await Promise.all([
    tdb.query((db, s) =>
      db
        .select({ id: clients.id, name: clients.name, v: sql<number>`coalesce(sum(${batches.totalCents}),0)::bigint`, n: sql<number>`count(${batches.id})::int` })
        .from(clients)
        .leftJoin(batches, and(eq(batches.clientId, clients.id), ne(batches.status, "canceled")))
        .where(and(s(clients), isNull(clients.anonymizedAt)))
        .groupBy(clients.id, clients.name),
    ),
    tdb.query((db, s) =>
      db
        .select({ id: receivables.clientId, v: sql<number>`coalesce(sum(${receivables.amountCents} - ${receivables.paidCents}),0)::bigint` })
        .from(receivables)
        .where(and(s(receivables), inArray(receivables.status, [...OPEN])))
        .groupBy(receivables.clientId),
    ),
    tdb.query((db, s) =>
      db
        .select({ id: receivables.clientId, d: sql<number>`avg(${payments.paidOn} - ${receivables.issuedOn})::float` })
        .from(payments)
        .innerJoin(receivables, eq(receivables.id, payments.receivableId))
        .where(and(s(payments), s(receivables)))
        .groupBy(receivables.clientId),
    ),
  ]);
  const om = new Map(owed.map((r) => [r.id, Number(r.v)]));
  const dm = new Map(pay.map((r) => [r.id, r.d]));
  return vol
    .map((c) => ({ id: c.id, name: c.name, volumeCents: Number(c.v), batches: c.n, owedCents: om.get(c.id) ?? 0, avgDaysToPay: dm.has(c.id) ? Math.round(dm.get(c.id)!) : null }))
    .filter((c) => c.volumeCents > 0 || c.owedCents > 0)
    .sort((a, b) => b.volumeCents - a.volumeCents);
}

/** Produção por pessoa nos últimos N dias (peças e valor a pagar). */
export async function workerProductivity(tdb: TenantDb, days = 30) {
  const since = new Date(Date.parse(todayISO() + "T00:00:00Z") - (days - 1) * 86_400_000).toISOString().slice(0, 10);
  const rows = await tdb.query((db, s) =>
    db
      .select({ id: workers.id, name: workers.name, pieces: sql<number>`coalesce(sum(${productionLogs.pieces}),0)::int`, cents: sql<number>`coalesce(sum(${productionLogs.amountCents}),0)::bigint`, days: sql<number>`count(distinct ${productionLogs.workDate})::int` })
      .from(productionLogs)
      .innerJoin(workers, eq(workers.id, productionLogs.workerId))
      .where(and(s(productionLogs), s(workers), gte(productionLogs.workDate, since)))
      .groupBy(workers.id, workers.name),
  );
  return rows.map((r) => ({ ...r, cents: Number(r.cents), perDay: r.days ? Math.round(r.pieces / r.days) : 0 })).sort((a, b) => b.pieces - a.pieces);
}

/** Números do mês: cortes recebidos, peças entregues, preço médio por peça e ticket médio. */
export async function monthNumbers(tdb: TenantDb) {
  const monthStart = todayISO().slice(0, 8) + "01";
  const [b, d] = await Promise.all([
    tdb.query((db, s) =>
      db
        .select({ n: sql<number>`count(*)::int`, total: sql<number>`coalesce(sum(${batches.totalCents}),0)::bigint`, qty: sql<number>`coalesce(sum(${batches.quantity}),0)::int` })
        .from(batches)
        .where(and(s(batches), ne(batches.status, "canceled"), gte(batches.createdAt, new Date(monthStart + "T00:00:00Z")))),
    ),
    tdb.query((db, s) =>
      db
        .select({ pieces: sql<number>`coalesce(sum(${deliveryProofs.quantity}),0)::int`, cents: sql<number>`coalesce(sum(${deliveryProofs.amountCents}),0)::bigint` })
        .from(deliveryProofs)
        .where(and(s(deliveryProofs), isNull(deliveryProofs.revokedAt), gte(deliveryProofs.createdAt, new Date(monthStart + "T00:00:00Z")))),
    ),
  ]);
  const batchesN = b[0]?.n ?? 0;
  const total = Number(b[0]?.total ?? 0);
  const qty = b[0]?.qty ?? 0;
  return {
    batches: batchesN,
    receivedCents: total,
    avgPricePerPieceCents: qty ? Math.round(total / qty) : 0,
    avgTicketCents: batchesN ? Math.round(total / batchesN) : 0,
    deliveredPieces: d[0]?.pieces ?? 0,
    deliveredCents: Number(d[0]?.cents ?? 0),
  };
}

/** Quem mais deve agora (para o Hoje). */
export async function topDebtors(tdb: TenantDb, limit = 4) {
  const rows = await tdb.query((db, s) =>
    db
      .select({ name: clients.name, v: sql<number>`coalesce(sum(${receivables.amountCents} - ${receivables.paidCents}),0)::bigint`, oldest: sql<string>`min(${receivables.issuedOn})` })
      .from(receivables)
      .innerJoin(clients, eq(clients.id, receivables.clientId))
      .where(and(s(receivables), s(clients), inArray(receivables.status, [...OPEN])))
      .groupBy(clients.name),
  );
  return rows
    .map((r) => ({ name: r.name, owedCents: Number(r.v), oldest: r.oldest }))
    .filter((r) => r.owedCents > 0)
    .sort((a, b) => b.owedCents - a.owedCents)
    .slice(0, limit);
}
