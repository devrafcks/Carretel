/** Consultas das telas (sempre via tenantDb). */
import "server-only";
import { and, asc, desc, eq, gte, inArray, isNull, lte, ne, notInArray, sql } from "drizzle-orm";
import {
  advances,
  batchOperations,
  batches,
  clients,
  deliveryProofs,
  payments,
  productionLogs,
  receivables,
  settlements,
  workers,
} from "@/db/schema";
import type { TenantDb } from "@/db/tenant";
import { daysBetween, todayISO } from "@/lib/dates";
import { settlementPeriod } from "@/lib/settlement";

export async function dashboardSummary(tdb: TenantDb) {
  const today = todayISO();
  const open = await tdb.select(receivables, notInArray(receivables.status, ["paid", "written_off"]));
  const owedCents = open.reduce((a, r) => a + (r.amountCents - r.paidCents), 0);
  const inProd = await tdb.select(batches, inArray(batches.status, ["received", "in_production", "ready"]));
  const piecesInProduction = inProd.reduce((a, b) => a + b.quantity, 0);
  const period = settlementPeriod(new Date(today + "T00:00:00Z"));
  const pendingLogs = await tdb.query((db, s) =>
    db
      .select({ amount: sql<number>`coalesce(sum(${productionLogs.amountCents}), 0)::int` })
      .from(productionLogs)
      .where(and(s(productionLogs), isNull(productionLogs.settlementId))),
  );
  const pendingAdv = await tdb.query((db, s) =>
    db
      .select({ amount: sql<number>`coalesce(sum(${advances.amountCents}), 0)::int` })
      .from(advances)
      .where(and(s(advances), isNull(advances.settlementId))),
  );
  const totalBatches = await tdb.query((db, s) =>
    db.select({ n: sql<number>`count(*)::int` }).from(batches).where(s(batches)),
  );
  const oldestOpen = open
    .filter((r) => r.status !== "awaiting_confirmation")
    .reduce((m, r) => Math.max(m, daysBetween(r.issuedOn, today)), 0);
  const awaiting = open.filter((r) => r.status === "awaiting_confirmation").length;
  const dueSoon = inProd
    .filter((b) => b.dueDate && daysBetween(today, b.dueDate) <= 2)
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
    .slice(0, 3);
  return {
    owedCents,
    openCount: open.length,
    oldestOpenDays: oldestOpen,
    awaitingCount: awaiting,
    batchesInProduction: inProd.length,
    piecesInProduction,
    payrollPendingCents: (pendingLogs[0]?.amount ?? 0) - (pendingAdv[0]?.amount ?? 0),
    period,
    totalBatches: totalBatches[0]?.n ?? 0,
    dueSoon,
  };
}

export async function listBatches(tdb: TenantDb, opts: { status?: string[]; limit?: number } = {}) {
  return tdb.query((db, s) =>
    db
      .select({ batch: batches, clientName: clients.name })
      .from(batches)
      .leftJoin(clients, and(eq(clients.id, batches.clientId), s(clients)))
      .where(and(s(batches), opts.status ? inArray(batches.status, opts.status as (typeof batches.status.enumValues)[number][]) : undefined))
      .orderBy(desc(batches.createdAt))
      .limit(opts.limit ?? 50),
  );
}

export async function batchDetail(tdb: TenantDb, batchId: string) {
  const batch = await tdb.first(batches, eq(batches.id, batchId));
  if (!batch) return null;
  const client = batch.clientId ? await tdb.first(clients, eq(clients.id, batch.clientId)) : undefined;
  const ops = await tdb.select(batchOperations, eq(batchOperations.batchId, batchId), { orderBy: asc(batchOperations.createdAt) });
  const proofs = await tdb.select(deliveryProofs, eq(deliveryProofs.batchId, batchId), { orderBy: desc(deliveryProofs.createdAt) });
  const recs = proofs.length ? await tdb.select(receivables, inArray(receivables.deliveryProofId, proofs.map((p) => p.id))) : [];
  const produced = await tdb.query((db, s) =>
    db
      .select({ op: productionLogs.operationId, pieces: sql<number>`sum(${productionLogs.pieces})::int` })
      .from(productionLogs)
      .where(and(s(productionLogs), eq(productionLogs.batchId, batchId)))
      .groupBy(productionLogs.operationId),
  );
  const delivered = proofs.filter((p) => !p.revokedAt).reduce((a, p) => a + p.quantity, 0);
  return { batch, client, ops, proofs, receivables: recs, produced, delivered };
}

export async function listClients(tdb: TenantDb) {
  return tdb.select(clients, isNull(clients.anonymizedAt), { orderBy: asc(clients.name) });
}

export async function listWorkers(tdb: TenantDb, includeInactive = false) {
  return tdb.select(workers, includeInactive ? undefined : eq(workers.active, true), { orderBy: asc(workers.name) });
}

export async function productionBoard(tdb: TenantDb) {
  const today = todayISO();
  const ws = await listWorkers(tdb);
  const todayLogs = await tdb.query((db, s) =>
    db
      .select({ workerId: productionLogs.workerId, pieces: sql<number>`sum(${productionLogs.pieces})::int`, amount: sql<number>`sum(${productionLogs.amountCents})::int` })
      .from(productionLogs)
      .where(and(s(productionLogs), eq(productionLogs.workDate, today)))
      .groupBy(productionLogs.workerId),
  );
  const pending = await tdb.query((db, s) =>
    db
      .select({ workerId: productionLogs.workerId, amount: sql<number>`sum(${productionLogs.amountCents})::int`, pieces: sql<number>`sum(${productionLogs.pieces})::int` })
      .from(productionLogs)
      .where(and(s(productionLogs), isNull(productionLogs.settlementId)))
      .groupBy(productionLogs.workerId),
  );
  const adv = await tdb.query((db, s) =>
    db
      .select({ workerId: advances.workerId, amount: sql<number>`sum(${advances.amountCents})::int` })
      .from(advances)
      .where(and(s(advances), isNull(advances.settlementId)))
      .groupBy(advances.workerId),
  );
  const openBatches = await tdb.query((db, s) =>
    db
      .select({ batch: batches, clientName: clients.name })
      .from(batches)
      .leftJoin(clients, and(eq(clients.id, batches.clientId), s(clients)))
      .where(and(s(batches), inArray(batches.status, ["received", "in_production", "ready"])))
      .orderBy(asc(batches.dueDate)),
  );
  const ops = openBatches.length
    ? await tdb.select(batchOperations, inArray(batchOperations.batchId, openBatches.map((b) => b.batch.id)))
    : [];
  const recentSettlements = await tdb.query((db, s) =>
    db
      .select({ settlement: settlements, workerName: workers.name })
      .from(settlements)
      .innerJoin(workers, and(eq(workers.id, settlements.workerId), s(workers)))
      .where(s(settlements))
      .orderBy(desc(settlements.createdAt))
      .limit(20),
  );
  const by = <T extends { workerId: string }>(rows: T[]) => new Map(rows.map((r) => [r.workerId, r]));
  const t = by(todayLogs);
  const p = by(pending);
  const a = by(adv);
  return {
    workers: ws.map((w) => ({
      worker: w,
      todayPieces: t.get(w.id)?.pieces ?? 0,
      todayCents: t.get(w.id)?.amount ?? 0,
      pendingCents: p.get(w.id)?.amount ?? 0,
      pendingPieces: p.get(w.id)?.pieces ?? 0,
      advancesCents: a.get(w.id)?.amount ?? 0,
    })),
    openBatches,
    ops,
    recentSettlements,
  };
}

export async function receivablesBoard(tdb: TenantDb) {
  const today = todayISO();
  const rows = await tdb.query((db, s) =>
    db
      .select({ receivable: receivables, proof: deliveryProofs, client: clients, batch: { id: batches.id, reference: batches.reference } })
      .from(receivables)
      .innerJoin(deliveryProofs, and(eq(deliveryProofs.id, receivables.deliveryProofId), s(deliveryProofs)))
      .innerJoin(batches, and(eq(batches.id, deliveryProofs.batchId), s(batches)))
      .leftJoin(clients, and(eq(clients.id, receivables.clientId), s(clients)))
      .where(and(s(receivables), ne(receivables.status, "written_off")))
      .orderBy(asc(receivables.issuedOn)),
  );
  const items = rows.map((r) => ({
    ...r,
    openCents: r.receivable.amountCents - r.receivable.paidCents,
    days: daysBetween(r.receivable.issuedOn, today),
  }));
  const open = items.filter((i) => i.receivable.status !== "paid");
  const buckets = { ok: 0, watch: 0, late: 0, critical: 0 };
  for (const i of open) {
    const k = i.days <= 7 ? "ok" : i.days <= 15 ? "watch" : i.days <= 30 ? "late" : "critical";
    buckets[k] += i.openCents;
  }
  return {
    open: open.sort((a, b) => b.days - a.days),
    paid: items.filter((i) => i.receivable.status === "paid").slice(-10).reverse(),
    totalOpenCents: open.reduce((a, i) => a + i.openCents, 0),
    buckets,
  };
}

export async function paymentsFor(tdb: TenantDb, receivableId: string) {
  return tdb.select(payments, eq(payments.receivableId, receivableId), { orderBy: desc(payments.paidOn) });
}

export async function workerHistory(tdb: TenantDb, workerId: string, sinceISO: string) {
  const logs = await tdb.query((db, s) =>
    db
      .select({ log: productionLogs, op: batchOperations, batch: { reference: batches.reference } })
      .from(productionLogs)
      .innerJoin(batchOperations, and(eq(batchOperations.id, productionLogs.operationId), s(batchOperations)))
      .innerJoin(batches, and(eq(batches.id, productionLogs.batchId), s(batches)))
      .where(and(s(productionLogs), eq(productionLogs.workerId, workerId), gte(productionLogs.workDate, sinceISO)))
      .orderBy(desc(productionLogs.workDate))
      .limit(100),
  );
  const adv = await tdb.select(advances, and(eq(advances.workerId, workerId), gte(advances.givenOn, sinceISO)), {
    orderBy: desc(advances.givenOn),
  });
  const sets = await tdb.select(settlements, eq(settlements.workerId, workerId), { orderBy: desc(settlements.createdAt), limit: 10 });
  return { logs, advances: adv, settlements: sets };
}

export { lte };
