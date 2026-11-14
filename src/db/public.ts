/**
 * Operações que, por natureza, NÃO são de uma oficina só (auditáveis, explícitas):
 * resolver membership do usuário, criar oficina, link público por token,
 * webhooks de billing, logs do Marco Civil, rate limit, parâmetros legais e crons.
 * Cada função devolve só o necessário e nunca aceita filtros arbitrários.
 */
import "server-only";
import { and, desc, eq, inArray, isNotNull, isNull, lt, lte, sql } from "drizzle-orm";
import { getDb } from "./client";
import {
  accessAuditLogs,
  billingWebhookEvents,
  deliveryProofs,
  devAuthCodes,
  legalAcceptances,
  legalParams,
  mediaAssets,
  rateLimits,
  settlements,
  subscriptions,
  workshopMembers,
  workshops,
  workshopSettings,
  workers,
  receivables,
  clients,
  batches,
  type PlanStatus,
} from "./schema";

/* ───── Membership / oficina ───── */
export async function findWorkshopForUser(userId: string) {
  const db = await getDb();
  const rows = await db
    .select({ workshop: workshops, role: workshopMembers.role })
    .from(workshopMembers)
    .innerJoin(workshops, eq(workshops.id, workshopMembers.workshopId))
    .where(and(eq(workshopMembers.userId, userId), isNull(workshops.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createWorkshopForUser(input: {
  userId: string;
  email: string | null;
  workshop: typeof workshops.$inferInsert;
  acceptances: Array<{ document: "terms" | "privacy" | "no_forced_labor"; version: string; locale: string }>;
  ip: string | null;
  userAgent: string | null;
}) {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const existing = await tx
      .select({ id: workshopMembers.workshopId })
      .from(workshopMembers)
      .where(eq(workshopMembers.userId, input.userId))
      .limit(1);
    if (existing[0]) return existing[0].id;
    const [ws] = await tx.insert(workshops).values(input.workshop).returning({ id: workshops.id });
    if (!ws) throw new Error("workshop_insert_failed");
    await tx.insert(workshopMembers).values({ workshopId: ws.id, userId: input.userId, email: input.email, role: "owner" });
    await tx.insert(workshopSettings).values({ workshopId: ws.id });
    if (input.acceptances.length) {
      await tx.insert(legalAcceptances).values(
        input.acceptances.map((a) => ({
          userId: input.userId,
          workshopId: ws.id,
          document: a.document,
          version: a.version,
          locale: a.locale,
          ip: input.ip,
          userAgent: input.userAgent,
        })),
      );
    }
    return ws.id;
  });
}

export async function setPlanStatus(workshopId: string, planStatus: PlanStatus) {
  const db = await getDb();
  await db.update(workshops).set({ planStatus, updatedAt: new Date() }).where(eq(workshops.id, workshopId));
}

/* ───── Link público de prova /c/[token] ───── */
export async function findProofByToken(token: string) {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const db = await getDb();
  const rows = await db
    .select({
      proof: deliveryProofs,
      workshop: {
        id: workshops.id,
        name: workshops.name,
        city: workshops.city,
        pixKey: workshops.pixKey,
        pixKeyType: workshops.pixKeyType,
        pixMerchantName: workshops.pixMerchantName,
        pixCity: workshops.pixCity,
        deletedAt: workshops.deletedAt,
      },
      receivable: receivables,
      client: { name: clients.name, preferredLocale: clients.preferredLocale },
      batch: { id: batches.id, reference: batches.reference },
    })
    .from(deliveryProofs)
    .innerJoin(workshops, eq(workshops.id, deliveryProofs.workshopId))
    .leftJoin(receivables, eq(receivables.deliveryProofId, deliveryProofs.id))
    .leftJoin(clients, eq(clients.id, receivables.clientId))
    .innerJoin(batches, eq(batches.id, deliveryProofs.batchId))
    .where(eq(deliveryProofs.publicToken, token))
    .limit(1);
  const r = rows[0];
  if (!r || r.workshop.deletedAt) return null;
  return r;
}

export async function markProofViewed(proofId: string, ip: string | null) {
  const db = await getDb();
  await db
    .update(deliveryProofs)
    .set({ viewedAt: new Date(), viewedIp: ip })
    .where(and(eq(deliveryProofs.id, proofId), isNull(deliveryProofs.viewedAt)));
}

export async function confirmProof(proofId: string, data: { name: string; ip: string | null; ua: string | null }) {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [p] = await tx
      .update(deliveryProofs)
      .set({ confirmedAt: new Date(), confirmedName: data.name, confirmedIp: data.ip, confirmedUserAgent: data.ua })
      .where(and(eq(deliveryProofs.id, proofId), isNull(deliveryProofs.confirmedAt), isNull(deliveryProofs.revokedAt)))
      .returning();
    if (!p) return null;
    await tx
      .update(receivables)
      .set({ status: "open", updatedAt: new Date() })
      .where(and(eq(receivables.deliveryProofId, proofId), inArray(receivables.status, ["awaiting_confirmation", "disputed"])));
    return p;
  });
}

export async function disputeProof(proofId: string, data: { quantity: number; comment: string }) {
  const db = await getDb();
  return db.transaction(async (tx) => {
    const [p] = await tx
      .update(deliveryProofs)
      .set({ disputedAt: new Date(), disputedQuantity: data.quantity, disputedComment: data.comment })
      .where(and(eq(deliveryProofs.id, proofId), isNull(deliveryProofs.confirmedAt), isNull(deliveryProofs.revokedAt)))
      .returning();
    if (!p) return null;
    await tx
      .update(receivables)
      .set({ status: "disputed", updatedAt: new Date() })
      .where(and(eq(receivables.deliveryProofId, proofId), eq(receivables.status, "awaiting_confirmation")));
    return p;
  });
}

export async function claimPaidByPayer(proofId: string) {
  const db = await getDb();
  await db
    .update(receivables)
    .set({ payerClaimedAt: new Date(), updatedAt: new Date() })
    .where(eq(receivables.deliveryProofId, proofId));
}

/** Mídia só é servida publicamente se pertencer à prova do token. */
export async function findPublicProofMedia(token: string, mediaId: string) {
  const r = await findProofByToken(token);
  if (!r || r.proof.revokedAt || !r.proof.photoIds.includes(mediaId)) return null;
  const db = await getDb();
  const rows = await db
    .select()
    .from(mediaAssets)
    .where(and(eq(mediaAssets.id, mediaId), eq(mediaAssets.workshopId, r.workshop.id), isNull(mediaAssets.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
}

/* ───── Recibo do costureiro /r/[token] ───── */
export async function findSettlementByToken(token: string) {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const db = await getDb();
  const rows = await db
    .select({
      settlement: settlements,
      worker: { name: workers.name },
      workshop: { name: workshops.name, city: workshops.city, deletedAt: workshops.deletedAt },
    })
    .from(settlements)
    .innerJoin(workers, eq(workers.id, settlements.workerId))
    .innerJoin(workshops, eq(workshops.id, settlements.workshopId))
    .where(eq(settlements.publicToken, token))
    .limit(1);
  const r = rows[0];
  if (!r || r.workshop.deletedAt) return null;
  return r;
}

/* ───── Billing / webhooks ───── */
export async function recordWebhookEvent(e: { id: string; type: string; payload: unknown; workshopId: string | null }) {
  const db = await getDb();
  const rows = await db
    .insert(billingWebhookEvents)
    .values({ id: e.id, type: e.type, payload: e.payload as object, workshopId: e.workshopId })
    .onConflictDoNothing()
    .returning({ id: billingWebhookEvents.id });
  return rows.length > 0;
}

export async function markWebhookProcessed(id: string, error: string | null) {
  const db = await getDb();
  await db.update(billingWebhookEvents).set({ processedAt: new Date(), error }).where(eq(billingWebhookEvents.id, id));
}

export async function findSubscriptionByRefs(refs: { externalId?: string | null; subscriptionId?: string | null; checkoutId?: string | null }) {
  const db = await getDb();
  const conds = [
    refs.subscriptionId ? eq(subscriptions.abacateSubscriptionId, refs.subscriptionId) : undefined,
    refs.checkoutId ? eq(subscriptions.abacateCheckoutId, refs.checkoutId) : undefined,
    refs.externalId ? eq(subscriptions.externalId, refs.externalId) : undefined,
  ].filter(Boolean);
  for (const c of conds) {
    const rows = await db.select().from(subscriptions).where(c!).limit(1);
    if (rows[0]) return rows[0];
  }
  return null;
}

export async function updateSubscriptionById(id: string, set: Partial<typeof subscriptions.$inferInsert>) {
  const db = await getDb();
  await db.update(subscriptions).set({ ...set, updatedAt: new Date() }).where(eq(subscriptions.id, id));
}

/* ───── Marco Civil: logs de acesso ───── */
export async function insertAuditLog(row: typeof accessAuditLogs.$inferInsert) {
  const db = await getDb();
  await db.insert(accessAuditLogs).values(row);
}

/* ───── Rate limit (janela fixa) ───── */
export async function hitRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const db = await getDb();
  const now = new Date();
  const windowStart = new Date(Math.floor(now.getTime() / (windowSeconds * 1000)) * windowSeconds * 1000);
  const rows = await db
    .insert(rateLimits)
    .values({ key, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`CASE WHEN ${rateLimits.windowStart} = ${windowStart} THEN ${rateLimits.count} + 1 ELSE 1 END`,
        windowStart,
      },
    })
    .returning({ count: rateLimits.count });
  return (rows[0]?.count ?? 1) > limit;
}

/* ───── Parâmetros legais ───── */
export async function currentLegalParam(key: string, onISO: string): Promise<{ valueCents: number; validFrom: string; source: string | null } | null> {
  const fromEnv = key === "minimum_wage_monthly_cents" ? Number(process.env.MINIMUM_WAGE_MONTHLY_CENTS || 0) : 0;
  const db = await getDb();
  const rows = await db
    .select()
    .from(legalParams)
    .where(and(eq(legalParams.key, key), lte(legalParams.validFrom, onISO)))
    .orderBy(desc(legalParams.validFrom))
    .limit(1);
  const r = rows[0];
  if (r) return { valueCents: r.valueCents, validFrom: r.validFrom, source: r.source };
  if (fromEnv > 0) return { valueCents: fromEnv, validFrom: onISO, source: "env:MINIMUM_WAGE_MONTHLY_CENTS" };
  return null;
}

/* ───── Auth de desenvolvimento (sem Neon Auth) ───── */
export async function upsertDevCode(email: string, codeHash: string, expiresAt: Date) {
  const db = await getDb();
  await db
    .insert(devAuthCodes)
    .values({ email, codeHash, expiresAt, attempts: 0 })
    .onConflictDoUpdate({ target: devAuthCodes.email, set: { codeHash, expiresAt, attempts: 0 } });
}

export async function consumeDevCode(email: string, codeHash: string): Promise<boolean> {
  const db = await getDb();
  const rows = await db.select().from(devAuthCodes).where(eq(devAuthCodes.email, email)).limit(1);
  const r = rows[0];
  if (!r || r.expiresAt < new Date() || r.attempts >= 5) return false;
  if (r.codeHash !== codeHash) {
    await db.update(devAuthCodes).set({ attempts: r.attempts + 1 }).where(eq(devAuthCodes.email, email));
    return false;
  }
  await db.delete(devAuthCodes).where(eq(devAuthCodes.email, email));
  return true;
}

/* ───── Crons ───── */
export async function purgeOldAuditLogs(olderThan: Date): Promise<number> {
  const db = await getDb();
  const rows = await db.delete(accessAuditLogs).where(lt(accessAuditLogs.occurredAt, olderThan)).returning({ id: accessAuditLogs.id });
  return rows.length;
}

export async function hardDeleteWorkshops(deletedBefore: Date): Promise<number> {
  const db = await getDb();
  const rows = await db
    .delete(workshops)
    .where(and(isNotNull(workshops.deletedAt), lt(workshops.deletedAt, deletedBefore)))
    .returning({ id: workshops.id });
  return rows.length;
}

export async function expireSubscriptions(now: Date): Promise<number> {
  const db = await getDb();
  const due = await db
    .select({ workshopId: subscriptions.workshopId })
    .from(subscriptions)
    .innerJoin(workshops, eq(workshops.id, subscriptions.workshopId))
    .where(and(lt(subscriptions.currentPeriodEnd, now), inArray(workshops.planStatus, ["past_due", "canceled"])));
  if (due.length === 0) return 0;
  await db
    .update(workshops)
    .set({ planStatus: "read_only", updatedAt: now })
    .where(inArray(workshops.id, due.map((d) => d.workshopId)));
  return due.length;
}

/* ───── Contadores da oficina (tabela workshops não tem workshop_id) ───── */
export async function incrementFreeBatches(workshopId: string) {
  const db = await getDb();
  await db
    .update(workshops)
    .set({ freeBatchesUsed: sql`${workshops.freeBatchesUsed} + 1`, updatedAt: new Date() })
    .where(and(eq(workshops.id, workshopId), inArray(workshops.planStatus, ["free", "pending_checkout"])));
}

export async function updateWorkshopRow(workshopId: string, set: Partial<typeof workshops.$inferInsert>) {
  const db = await getDb();
  const clean = { ...set } as Record<string, unknown>;
  delete clean.id;
  delete clean.planStatus;
  delete clean.freeBatchesUsed;
  await db.update(workshops).set({ ...clean, updatedAt: new Date() }).where(eq(workshops.id, workshopId));
}

export async function softDeleteWorkshop(workshopId: string) {
  const db = await getDb();
  await db.update(workshops).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(workshops.id, workshopId));
}
