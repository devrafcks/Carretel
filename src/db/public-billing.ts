import "server-only";
import { and, eq, inArray, isNotNull, lt, ne, or, sql } from "drizzle-orm";
import { getDb } from "./client";
import { subscriptions, workshops, type PlanStatus } from "./schema";

export async function getWorkshopPlan(workshopId: string): Promise<PlanStatus | null> {
  const db = await getDb();
  const rows = await db.select({ s: workshops.planStatus }).from(workshops).where(eq(workshops.id, workshopId)).limit(1);
  return rows[0]?.s ?? null;
}

/** Linha da oficina (para conciliação no cron, sem sessão). */
export async function getWorkshopRow(workshopId: string) {
  const db = await getDb();
  const rows = await db.select().from(workshops).where(eq(workshops.id, workshopId)).limit(1);
  return rows[0] ?? null;
}

/** Oficinas com teste/período vencido ou checkout em aberto, para o cron conferir na AbacatePay. */
export async function workshopsToReconcile(now: Date): Promise<string[]> {
  const db = await getDb();
  const rows = await db
    .select({ id: subscriptions.workshopId })
    .from(subscriptions)
    .innerJoin(workshops, eq(workshops.id, subscriptions.workshopId))
    .where(
      or(
        and(inArray(workshops.planStatus, ["trialing", "active"]), lt(subscriptions.currentPeriodEnd, now)),
        and(eq(subscriptions.status, "pending_checkout"), isNotNull(subscriptions.abacateCheckoutId)),
      ),
    )
    .limit(500);
  return rows.map((r) => r.id);
}

/**
 * Oficinas que já pagaram (ou começaram o teste) na faixa de fundador — cada uma ocupa uma vaga para sempre.
 * Checkout aberto e não pago não conta. `excludeWorkshopId` tira a própria oficina da conta.
 */
export async function countFounders(excludeWorkshopId?: string): Promise<number> {
  const db = await getDb();
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.priceTier, "founder"),
        or(isNotNull(subscriptions.firstChargedAt), isNotNull(subscriptions.trialEndsAt), isNotNull(subscriptions.abacateSubscriptionId)),
        excludeWorkshopId ? ne(subscriptions.workshopId, excludeWorkshopId) : undefined,
      ),
    );
  return Number(rows[0]?.n ?? 0);
}

/**
 * Aplica um pagamento só se a assinatura ainda estiver aguardando (status pending_checkout).
 * Webhook e conciliação podem chegar juntos: só o primeiro aplica (evita somar 12 meses duas vezes).
 */
export async function claimPendingSubscription(id: string, set: Partial<typeof subscriptions.$inferInsert>): Promise<boolean> {
  const db = await getDb();
  const rows = await db
    .update(subscriptions)
    .set({ ...set, updatedAt: new Date() })
    .where(and(eq(subscriptions.id, id), eq(subscriptions.status, "pending_checkout")))
    .returning({ id: subscriptions.id });
  return rows.length > 0;
}
