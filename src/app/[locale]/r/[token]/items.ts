import "server-only";
import { eq } from "drizzle-orm";
import { tenantDb } from "@/db/tenant";
import { settlementItems } from "@/db/schema";

/** Itens do recibo — escopados pela oficina dona do acerto (token já validado). */
export async function getDbItems(workshopId: string, settlementId: string) {
  const tdb = await tenantDb(workshopId);
  return tdb.select(settlementItems, eq(settlementItems.settlementId, settlementId));
}
