/**
 * Notificações do taller.
 * - Eventos do link público (abriu, confirmou, contestou, "já paguei") entram por db/public.notifyWorkshop.
 * - Lembretes (dívida antiga, corte vencendo/atrasado, dia de acerto) são gerados aqui de forma idempotente:
 *   cada aviso tem uma dedupeKey, então rodar várias vezes não duplica nada.
 */
import "server-only";
import { and, desc, eq, inArray, isNotNull, isNull, lte, sql } from "drizzle-orm";
import { batches, clients, deliveryProofs, notifications, productionLogs, receivables, type NotificationKind, type NotificationParams } from "@/db/schema";
import type { TenantDb } from "@/db/tenant";
import { addDaysISO, daysBetween, todayISO } from "@/lib/dates";

type Draft = { kind: NotificationKind; dedupeKey: string; params: NotificationParams; href: string | null };

const OVERDUE_STEPS = [15, 30, 60] as const;
const OPEN_DEBT = ["open", "partially_paid", "awaiting_confirmation", "disputed"] as const;
const OPEN_BATCH = ["received", "in_production", "ready"] as const;

/** Lembretes do dia. Evita rodar mais de uma vez por minuto por taller (as leituras são frequentes). */
const lastRun = new Map<string, number>();

export async function syncReminders(tdb: TenantDb): Promise<void> {
  const now = Date.now();
  if ((lastRun.get(tdb.workshopId) ?? 0) > now - 60_000) return;
  lastRun.set(tdb.workshopId, now);

  const today = todayISO();
  const tomorrow = addDaysISO(today, 1);
  const drafts: Draft[] = [];

  // 1) dívidas antigas: um aviso ao passar de 15, 30 e 60 dias
  const debts = await tdb.query((db, s) =>
    db
      .select({ r: receivables, client: clients.name, ref: batches.reference, batchId: batches.id })
      .from(receivables)
      .leftJoin(clients, eq(clients.id, receivables.clientId))
      .innerJoin(deliveryProofs, eq(deliveryProofs.id, receivables.deliveryProofId))
      .innerJoin(batches, eq(batches.id, deliveryProofs.batchId))
      .where(and(s(receivables), inArray(receivables.status, [...OPEN_DEBT]), lte(receivables.issuedOn, addDaysISO(today, -OVERDUE_STEPS[0])))),
  );
  for (const d of debts) {
    const days = daysBetween(d.r.issuedOn, today);
    const step = [...OVERDUE_STEPS].reverse().find((n) => days >= n);
    if (!step) continue;
    drafts.push({
      kind: "receivable_overdue",
      dedupeKey: `overdue${step}:${d.r.id}`,
      params: { client: d.client, ref: d.ref, amountCents: d.r.amountCents - d.r.paidCents, days },
      href: "/cobros",
    });
  }

  // 2) cortes com prazo hoje/amanhã e cortes atrasados
  const due = await tdb.query((db, s) =>
    db
      .select({ b: batches, client: clients.name })
      .from(batches)
      .leftJoin(clients, eq(clients.id, batches.clientId))
      .where(and(s(batches), inArray(batches.status, [...OPEN_BATCH]), isNotNull(batches.dueDate), lte(batches.dueDate, tomorrow))),
  );
  for (const { b, client } of due) {
    const dueDate = b.dueDate!;
    if (dueDate < today) {
      drafts.push({ kind: "batch_late", dedupeKey: `late:${b.id}:${dueDate}`, params: { client, ref: b.reference, date: dueDate, quantity: b.quantity }, href: `/lotes/${b.id}` });
    } else {
      drafts.push({
        kind: "batch_due_soon",
        dedupeKey: `due:${b.id}:${dueDate}`,
        params: { client, ref: b.reference, when: dueDate === today ? "today" : "tomorrow", quantity: b.quantity },
        href: `/lotes/${b.id}`,
      });
    }
  }

  // 3) sábado com produção ainda sem acerto
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();
  if (weekday === 6) {
    const pending = await tdb.query((db, s) =>
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(productionLogs)
        .where(and(s(productionLogs), isNull(productionLogs.settlementId), lte(productionLogs.workDate, today))),
    );
    if ((pending[0]?.n ?? 0) > 0) drafts.push({ kind: "settlement_day", dedupeKey: `settle:${today}`, params: { date: today }, href: "/produccion?tab=acerto" });
  }

  if (!drafts.length) return;
  await tdb.query((db) =>
    db
      .insert(notifications)
      .values(drafts.map((d) => ({ ...d, workshopId: tdb.workshopId })))
      .onConflictDoNothing({ target: [notifications.workshopId, notifications.dedupeKey] }),
  );
}

export async function listNotifications(tdb: TenantDb, limit = 30) {
  const [items, unread] = await Promise.all([
    tdb.select(notifications, undefined, { orderBy: desc(notifications.createdAt), limit }),
    tdb.query((db, s) =>
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(notifications)
        .where(and(s(notifications), isNull(notifications.readAt))),
    ),
  ]);
  return { items, unread: unread[0]?.n ?? 0 };
}

export async function markNotificationsRead(tdb: TenantDb, ids: string[] | "all") {
  const cond = ids === "all" ? isNull(notifications.readAt) : and(isNull(notifications.readAt), inArray(notifications.id, ids));
  if (ids !== "all" && !ids.length) return;
  await tdb.update(notifications, { readAt: new Date() }, cond!);
}

export type NotificationItem = Awaited<ReturnType<typeof listNotifications>>["items"][number];
