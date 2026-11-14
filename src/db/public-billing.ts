import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "./client";
import { workshops, type PlanStatus } from "./schema";

export async function getWorkshopPlan(workshopId: string): Promise<PlanStatus | null> {
  const db = await getDb();
  const rows = await db.select({ s: workshops.planStatus }).from(workshops).where(eq(workshops.id, workshopId)).limit(1);
  return rows[0]?.s ?? null;
}
