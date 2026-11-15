/** Séries dos gráficos do painel (Hoje e Relatórios). Sempre via tenantDb: só dados do próprio taller. */
import "server-only";
import { and, eq, gte, inArray, isNotNull, isNull, ne, sql } from "drizzle-orm";
import { advances, batchOperations, batches, deliveryProofs, payments, productionLogs, receivables } from "@/db/schema";
import type { TenantDb } from "@/db/tenant";
import { addDaysISO, daysBetween, todayISO } from "@/lib/dates";

const TZ = "America/Sao_Paulo";

/** Segunda-feira (ISO) da semana de uma data ISO. */
function mondayOf(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  const dow = (d.getUTCDay() + 6) % 7; // 0 = segunda
  return addDaysISO(iso, -dow);
}

/** As últimas N semanas (segundas), da mais antiga para a atual. */
export function weekKeys(n: number): string[] {
  const cur = mondayOf(todayISO());
  return Array.from({ length: n }, (_, i) => addDaysISO(cur, -7 * (n - 1 - i)));
}

export function monthKeys(n: number): string[] {
  const [y, m] = todayISO().split("-").map(Number) as [number, number];
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (n - 1 - i), 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

const n = (v: unknown) => Number(v ?? 0);

/* ───────────── Hoje ───────────── */

/** Cortes em cada etapa agora (cancelados ficam de fora; fechados contam como entregues). */
export async function batchPipeline(tdb: TenantDb) {
  const rows = await tdb.query((db, s) =>
    db
      .select({ status: batches.status, count: sql<number>`count(*)::int`, pieces: sql<number>`coalesce(sum(${batches.quantity}),0)::int` })
      .from(batches)
      .where(and(s(batches), ne(batches.status, "canceled"), gte(batches.createdAt, new Date(Date.now() - 90 * 86_400_000))))
      .groupBy(batches.status),
  );
  const get = (k: string) => rows.filter((r) => r.status === k).reduce((a, r) => a + r.count, 0);
  return {
    received: get("received"),
    inProduction: get("in_production"),
    ready: get("ready"),
    delivered: get("delivered") + get("closed"),
  };
}

/** Quanto está em aberto (já aceito) por idade da cobrança. */
export async function agingBuckets(tdb: TenantDb) {
  const today = todayISO();
  const rows = await tdb.select(receivables, inArray(receivables.status, ["open", "partially_paid", "disputed"]));
  const b = { ok: 0, watch: 0, late: 0, critical: 0 };
  for (const r of rows) {
    const d = daysBetween(r.issuedOn, today);
    const k = d <= 7 ? "ok" : d <= 15 ? "watch" : d <= 30 ? "late" : "critical";
    b[k] += r.amountCents - r.paidCents;
  }
  return b;
}

/** Peças entregues (comprovantes válidos) por semana. */
export async function weeklyDelivered(tdb: TenantDb, weeks = 8) {
  const keys = weekKeys(weeks);
  const rows = await tdb.query((db, s) =>
    db
      .select({
        w: sql<string>`to_char(date_trunc('week', ${deliveryProofs.createdAt} at time zone ${TZ}), 'YYYY-MM-DD')`,
        pieces: sql<number>`coalesce(sum(${deliveryProofs.quantity}),0)::int`,
      })
      .from(deliveryProofs)
      .where(and(s(deliveryProofs), isNull(deliveryProofs.revokedAt), gte(deliveryProofs.createdAt, new Date(keys[0] + "T00:00:00-03:00"))))
      .groupBy(sql`1`),
  );
  const m = new Map(rows.map((r) => [r.w, r.pieces]));
  return keys.map((k) => ({ week: k, pieces: m.get(k) ?? 0 }));
}

/** Como os clientes pagaram nos últimos 90 dias. */
export async function paymentMethods(tdb: TenantDb) {
  const since = addDaysISO(todayISO(), -90);
  const rows = await tdb.query((db, s) =>
    db
      .select({ method: payments.method, cents: sql<number>`coalesce(sum(${payments.amountCents}),0)::bigint` })
      .from(payments)
      .where(and(s(payments), gte(payments.paidOn, since)))
      .groupBy(payments.method),
  );
  const get = (k: string) => n(rows.find((r) => r.method === k)?.cents);
  return { pix: get("pix"), cash: get("cash"), other: get("other") };
}

/* ───────────── Relatórios ───────────── */

/** Por mês: cortes recebidos (quantidade, peças, valor) e peças entregues. */
export async function batchesByMonth(tdb: TenantDb, months = 12) {
  const keys = monthKeys(months);
  const since = new Date(`${keys[0]}-01T00:00:00-03:00`);
  const [b, d] = await Promise.all([
    tdb.query((db, s) =>
      db
        .select({
          m: sql<string>`to_char(${batches.createdAt} at time zone ${TZ}, 'YYYY-MM')`,
          count: sql<number>`count(*)::int`,
          qty: sql<number>`coalesce(sum(${batches.quantity}),0)::int`,
          total: sql<number>`coalesce(sum(${batches.totalCents}),0)::bigint`,
        })
        .from(batches)
        .where(and(s(batches), ne(batches.status, "canceled"), gte(batches.createdAt, since)))
        .groupBy(sql`1`),
    ),
    tdb.query((db, s) =>
      db
        .select({ m: sql<string>`to_char(${deliveryProofs.createdAt} at time zone ${TZ}, 'YYYY-MM')`, pieces: sql<number>`coalesce(sum(${deliveryProofs.quantity}),0)::int` })
        .from(deliveryProofs)
        .where(and(s(deliveryProofs), isNull(deliveryProofs.revokedAt), gte(deliveryProofs.createdAt, since)))
        .groupBy(sql`1`),
    ),
  ]);
  const bm = new Map(b.map((r) => [r.m, r]));
  const dm = new Map(d.map((r) => [r.m, r.pieces]));
  return keys.map((k) => {
    const r = bm.get(k);
    const count = r?.count ?? 0;
    const qty = r?.qty ?? 0;
    const total = n(r?.total);
    return {
      month: k,
      batches: count,
      receivedPieces: qty,
      deliveredPieces: dm.get(k) ?? 0,
      totalCents: total,
      avgTicketCents: count ? Math.round(total / count) : 0,
      avgPieceCents: qty ? Math.round(total / qty) : 0,
    };
  });
}

/** Peças produzidas por máquina nos últimos N dias. */
export async function productionByMachine(tdb: TenantDb, days = 30) {
  const since = addDaysISO(todayISO(), -(days - 1));
  const rows = await tdb.query((db, s) =>
    db
      .select({ machine: batchOperations.machine, pieces: sql<number>`coalesce(sum(${productionLogs.pieces}),0)::int` })
      .from(productionLogs)
      .innerJoin(batchOperations, eq(batchOperations.id, productionLogs.operationId))
      .where(and(s(productionLogs), s(batchOperations), gte(productionLogs.workDate, since)))
      .groupBy(batchOperations.machine),
  );
  return rows.filter((r) => r.pieces > 0).sort((a, b) => b.pieces - a.pieces);
}

/** Produção por dia: base do calendário e da média por dia da semana. */
export async function productionDaily(tdb: TenantDb, days = 84) {
  const since = addDaysISO(todayISO(), -(days - 1));
  const rows = await tdb.query((db, s) =>
    db
      .select({ d: sql<string>`to_char(${productionLogs.workDate}, 'YYYY-MM-DD')`, pieces: sql<number>`coalesce(sum(${productionLogs.pieces}),0)::int` })
      .from(productionLogs)
      .where(and(s(productionLogs), gte(productionLogs.workDate, since)))
      .groupBy(sql`1`),
  );
  const m = new Map(rows.map((r) => [r.d, r.pieces]));
  return Array.from({ length: days }, (_, i) => {
    const day = addDaysISO(since, i);
    return { day, pieces: m.get(day) ?? 0 };
  });
}

/** Média de peças por dia da semana (seg..dom), só contando dias com produção. */
export function weekdayAverages(daily: { day: string; pieces: number }[]) {
  const sum = Array(7).fill(0) as number[];
  const cnt = Array(7).fill(0) as number[];
  for (const d of daily) {
    if (!d.pieces) continue;
    const dow = (new Date(d.day + "T12:00:00Z").getUTCDay() + 6) % 7;
    sum[dow]! += d.pieces;
    cnt[dow]! += 1;
  }
  return sum.map((s, i) => (cnt[i] ? Math.round(s / cnt[i]!) : 0));
}

/** Produção (a pagar) x vales por semana. */
export async function payrollWeekly(tdb: TenantDb, weeks = 8) {
  const keys = weekKeys(weeks);
  const since = keys[0]!;
  const [p, a] = await Promise.all([
    tdb.query((db, s) =>
      db
        .select({ w: sql<string>`to_char(date_trunc('week', ${productionLogs.workDate}), 'YYYY-MM-DD')`, v: sql<number>`coalesce(sum(${productionLogs.amountCents}),0)::bigint` })
        .from(productionLogs)
        .where(and(s(productionLogs), gte(productionLogs.workDate, since)))
        .groupBy(sql`1`),
    ),
    tdb.query((db, s) =>
      db
        .select({ w: sql<string>`to_char(date_trunc('week', ${advances.givenOn}), 'YYYY-MM-DD')`, v: sql<number>`coalesce(sum(${advances.amountCents}),0)::bigint` })
        .from(advances)
        .where(and(s(advances), gte(advances.givenOn, since)))
        .groupBy(sql`1`),
    ),
  ]);
  const pm = new Map(p.map((r) => [r.w, n(r.v)]));
  const am = new Map(a.map((r) => [r.w, n(r.v)]));
  return keys.map((k) => ({ week: k, productionCents: pm.get(k) ?? 0, advancesCents: am.get(k) ?? 0 }));
}

/** Situação dos comprovantes dos últimos 90 dias. */
export async function proofOutcomes(tdb: TenantDb) {
  const rows = await tdb.select(deliveryProofs, gte(deliveryProofs.createdAt, new Date(Date.now() - 90 * 86_400_000)));
  const o = { confirmed: 0, awaiting: 0, disputed: 0, revoked: 0 };
  for (const p of rows) {
    if (p.revokedAt) o.revoked++;
    else if (p.disputedAt) o.disputed++;
    else if (p.confirmedAt) o.confirmed++;
    else o.awaiting++;
  }
  return o;
}

/** Entregas no prazo x atrasadas (primeiro comprovante x data combinada do corte). */
export async function onTimeDelivery(tdb: TenantDb) {
  const rows = await tdb.query((db, s) =>
    db
      .select({
        due: batches.dueDate,
        first: sql<string>`to_char(min(${deliveryProofs.createdAt} at time zone ${TZ}), 'YYYY-MM-DD')`,
      })
      .from(batches)
      .innerJoin(deliveryProofs, and(eq(deliveryProofs.batchId, batches.id), s(deliveryProofs)))
      .where(and(s(batches), isNotNull(batches.dueDate), gte(batches.createdAt, new Date(Date.now() - 180 * 86_400_000))))
      .groupBy(batches.id, batches.dueDate),
  );
  let onTime = 0;
  let late = 0;
  for (const r of rows) {
    if (!r.due || !r.first) continue;
    if (r.first <= r.due) onTime++;
    else late++;
  }
  return { onTime, late };
}
