import "server-only";
import { and, eq, inArray, isNotNull, lt, or } from "drizzle-orm";
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
