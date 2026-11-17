/**
 * Regras de negócio (usadas pelas Server Actions e pelo /api/sync).
 * Todas recebem o contexto da oficina (tenantDb já escopado) e input validado por zod.
 */
import "server-only";
import { and, asc, desc, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import {
  advances,
  batchOperations,
  batches,
  clients,
  deliveryProofs,
  mediaAssets,
  payments,
  productionLogs,
  receivables,
  settlementItems,
  settlements,
  outsourceReturns,
  outsourceShipments,
  workers,
  workerRates,
  workshopSettings,
  type Machine,
  type ProofSnapshot,
  type SizeGrid,
} from "@/db/schema";
import type { WorkshopContext } from "@/lib/session";
import type {
  AdvanceInput,
  BatchCreateInput,
  DeliveryInput,
  PaymentInput,
  ProductionLogInput,
} from "@/lib/schemas";
import { clientCreateSchema, workerCreateSchema } from "@/lib/schemas";
import type { z } from "zod";
import { canonicalJson, encryptField, last3, publicToken, sha256Hex } from "@/lib/crypto";
import { toE164 } from "@/lib/validators";
import { computeSettlement, pickWorkerRate } from "@/lib/settlement";
import { currentLegalParam, incrementFreeBatches } from "@/db/public";
import { todayISO } from "@/lib/dates";
import { isPremium } from "@/lib/subscription";
import { brand } from "@/config/brand";
import { maxReturnable, shipmentStatus, summarizeShipment } from "@/lib/outsource";

export class DomainError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

type Ctx = Pick<WorkshopContext, "tdb" | "workshop" | "access" | "user">;

/** Ids de fotos desta oficina que existem (só o id: não traz os bytes da imagem do banco). */
export async function existingMediaIds(ctx: Pick<Ctx, "tdb">, ids: string[]): Promise<string[]> {
  if (!ids.length) return [];
  const rows = await ctx.tdb.query((db, scope) =>
    db
      .select({ id: mediaAssets.id })
      .from(mediaAssets)
      .where(and(scope(mediaAssets), inArray(mediaAssets.id, ids), isNull(mediaAssets.deletedAt))),
  );
  return rows.map((r) => r.id);
}

/** Plano permite criar/editar registros do dia a dia (grátis dentro do limite, teste ou pago em dia). */
export function requireWrite(ctx: Ctx) {
  if (!ctx.access.canWrite) throw new DomainError("read_only");
}

/** Recursos do plano completo (cadeado na interface): bloqueados também aqui, não só na tela. */
export function requirePremium(ctx: Pick<Ctx, "workshop" | "access">) {
  if (!isPremium(ctx.workshop.planStatus, ctx.access)) throw new DomainError("premium_required");
}

/** Plano grátis: até brand.freeClientLimit clientes ativos. */
async function assertClientSlot(ctx: Ctx, tdb: Ctx["tdb"] = ctx.tdb) {
  if (isPremium(ctx.workshop.planStatus, ctx.access)) return;
  const n = await tdb.query((db, scope) => db.select({ n: sql<number>`count(*)::int` }).from(clients).where(and(scope(clients), isNull(clients.anonymizedAt))));
  if ((n[0]?.n ?? 0) >= brand.freeClientLimit) throw new DomainError("free_limit_clients");
}

/** Plano grátis: até brand.freeTeamLimit pessoas ativas na equipe. */
async function assertTeamSlot(ctx: Ctx) {
  if (isPremium(ctx.workshop.planStatus, ctx.access)) return;
  const n = await ctx.tdb.query((db, scope) => db.select({ n: sql<number>`count(*)::int` }).from(workers).where(and(scope(workers), eq(workers.active, true))));
  if ((n[0]?.n ?? 0) >= brand.freeTeamLimit) throw new DomainError("free_limit_team");
}

/** Só quem é dono do taller mexe em assinatura, dados do taller e exclusão da conta. */
export function requireOwner(ctx: Pick<WorkshopContext, "role">) {
  if (ctx.role !== "owner") throw new DomainError("owner_only");
}

/* ───── Contratantes ───── */
export async function createClientCore(ctx: Ctx, input: z.input<typeof clientCreateSchema>, cmid?: string) {
  requireWrite(ctx);
  const v = clientCreateSchema.parse(input);
  if (cmid) {
    const existing = await ctx.tdb.first(clients, eq(clients.clientMutationId, cmid));
    if (existing) return existing;
  }
  await assertClientSlot(ctx);
  const values = {
    name: v.name,
    phoneE164: v.phone ? toE164(v.phone) : null,
    preferredLocale: v.preferredLocale,
    notes: v.notes ?? null,
    usualReference: v.usualReference ?? null,
    usualUnitPriceCents: v.usualUnitPriceCents ?? null,
  };
  if (cmid) return (await ctx.tdb.insertIdempotent(clients, { ...values, clientMutationId: cmid })).row;
  return ctx.tdb.insert(clients, values);
}

export async function anonymizeClientCore(ctx: Ctx, clientId: string) {
  const c = await ctx.tdb.get(clients, eq(clients.id, clientId), "client");
  const label = "Cliente #" + c.id.slice(0, 6).toUpperCase();
  await ctx.tdb.update(clients, { name: label, phoneE164: null, notes: null, anonymizedAt: new Date() }, eq(clients.id, clientId));
}

/* ───── Equipe ───── */
export async function createWorkerCore(ctx: Ctx, input: z.input<typeof workerCreateSchema>, cmid?: string) {
  requireWrite(ctx);
  const v = workerCreateSchema.parse(input);
  if (cmid) {
    const existing = await ctx.tdb.first(workers, eq(workers.clientMutationId, cmid));
    if (existing) return existing;
  }
  await assertTeamSlot(ctx);
  const values = {
    name: v.name,
    phoneE164: v.phone ? toE164(v.phone) : null,
    isEmployee: v.isEmployee,
    docType: v.docNumber ? v.docType ?? null : null,
    docNumberEnc: v.docNumber ? encryptField(v.docNumber) : null,
    docLast3: v.docNumber ? last3(v.docNumber) : null,
  };
  if (cmid) return (await ctx.tdb.insertIdempotent(workers, { ...values, clientMutationId: cmid })).row;
  return ctx.tdb.insert(workers, values);
}

export async function anonymizeWorkerCore(ctx: Ctx, workerId: string) {
  const w = await ctx.tdb.get(workers, eq(workers.id, workerId), "worker");
  await ctx.tdb.update(
    workers,
    {
      name: "Trabajador #" + w.id.slice(0, 6).toUpperCase(),
      phoneE164: null,
      docNumberEnc: null,
      docLast3: null,
      docType: null,
      active: false,
      anonymizedAt: new Date(),
    },
    eq(workers.id, workerId),
  );
}

/* ───── Lotes ───── */
export async function createBatchCore(ctx: Ctx, v: BatchCreateInput, cmid?: string) {
  if (cmid) {
    const existing = await ctx.tdb.first(batches, eq(batches.clientMutationId, cmid));
    if (existing) return { batch: existing, duplicate: true };
  }
  if (!ctx.access.canCreateBatch) throw new DomainError(ctx.access.reason === "read_only" ? "read_only" : "free_exhausted");
  if (v.photoIds.length) {
    if ((await existingMediaIds(ctx, v.photoIds)).length !== new Set(v.photoIds).size) throw new DomainError("photo_not_found");
  }
  const result = await ctx.tdb.transaction(async (tx) => {
    let clientId = v.clientId ?? null;
    if (clientId) {
      const c = await tx.get(clients, eq(clients.id, clientId), "client");
      // cliente recorrente: o primeiro corte vira o serviço de costume (modelo e preço), se ainda não houver
      if (c.usualUnitPriceCents === null && c.usualReference === null) {
        await tx.update(clients, { usualReference: v.reference ?? null, usualUnitPriceCents: v.unitPriceCents, updatedAt: new Date() }, eq(clients.id, c.id));
      }
    }
    if (!clientId && v.newClientName) {
      await assertClientSlot(ctx, tx);
      const c = await tx.insert(clients, { name: v.newClientName, preferredLocale: "pt-BR", usualReference: v.reference ?? null, usualUnitPriceCents: v.unitPriceCents });
      clientId = c.id;
    }
    const totalCents = v.quantity * v.unitPriceCents;
    const values = {
      clientId,
      reference: v.reference ?? null,
      quantity: v.quantity,
      sizeGrid: v.sizeGrid && Object.keys(v.sizeGrid).length ? v.sizeGrid : null,
      color: v.color ?? null,
      unitPriceCents: v.unitPriceCents,
      totalCents,
      dueDate: v.dueDate ?? null,
      suppliesBy: v.suppliesBy,
      suppliesNote: v.suppliesNote ?? null,
      photoIds: v.photoIds,
    };
    const batch = cmid
      ? (await tx.insertIdempotent(batches, { ...values, clientMutationId: cmid })).row
      : await tx.insert(batches, values);
    if (v.operations.length) {
      await tx.insertMany(
        batchOperations,
        v.operations.map((o) => ({ batchId: batch.id, machine: o.machine, label: o.label ?? null, pieceRateCents: o.pieceRateCents })),
      );
    }
    return batch;
  });
  if (ctx.workshop.planStatus === "free" || ctx.workshop.planStatus === "pending_checkout") {
    await incrementFreeBatches(ctx.workshop.id);
  }
  return { batch: result, duplicate: false };
}

const BATCH_FLOW: Record<string, string[]> = {
  received: ["in_production", "canceled"],
  in_production: ["ready", "received", "canceled"],
  ready: ["in_production", "delivered", "canceled"],
  delivered: ["closed", "ready"],
  closed: [],
  canceled: ["received"],
};

export async function setBatchStatusCore(ctx: Ctx, batchId: string, status: string) {
  requireWrite(ctx);
  const b = await ctx.tdb.get(batches, eq(batches.id, batchId), "batch");
  if (!BATCH_FLOW[b.status]?.includes(status)) throw new DomainError("invalid_transition");
  await ctx.tdb.update(
    batches,
    { status: status as typeof b.status, version: b.version + 1, updatedAt: new Date() },
    and(eq(batches.id, batchId), eq(batches.version, b.version))!,
  );
}

export async function upsertOperationCore(ctx: Ctx, batchId: string, machine: Machine, pieceRateCents: number, label?: string) {
  requireWrite(ctx);
  await ctx.tdb.get(batches, eq(batches.id, batchId), "batch");
  const existing = await ctx.tdb.first(
    batchOperations,
    and(eq(batchOperations.batchId, batchId), eq(batchOperations.machine, machine)),
  );
  if (existing) {
    const [row] = await ctx.tdb.update(batchOperations, { pieceRateCents, label: label ?? existing.label }, eq(batchOperations.id, existing.id));
    return row!;
  }
  return ctx.tdb.insert(batchOperations, { batchId, machine, pieceRateCents, label: label ?? null });
}

/* ───── Produção ───── */
export async function logProductionCore(ctx: Ctx, v: ProductionLogInput, cmid?: string) {
  if (cmid) {
    const existing = await ctx.tdb.first(productionLogs, eq(productionLogs.clientMutationId, cmid));
    if (existing) return { log: existing, duplicate: true };
  }
  requireWrite(ctx);
  await ctx.tdb.get(workers, eq(workers.id, v.workerId), "worker");
  const batch = await ctx.tdb.get(batches, eq(batches.id, v.batchId), "batch");
  let op = v.operationId ? await ctx.tdb.get(batchOperations, and(eq(batchOperations.id, v.operationId), eq(batchOperations.batchId, batch.id))!, "operation") : undefined;
  if (!op) {
    if (!v.machine || !v.pieceRateCents) throw new DomainError("operation_rate_required");
    op = await upsertOperationCore(ctx, batch.id, v.machine, v.pieceRateCents);
  }
  // folha por peça: se a costureira tem valor próprio para este modelo/máquina, ele vale sobre o da operação
  const rates = await ctx.tdb.select(workerRates, eq(workerRates.workerId, v.workerId));
  const rate = pickWorkerRate(rates, { machine: op.machine, reference: batch.reference }) ?? op.pieceRateCents;
  const values = {
    batchId: batch.id,
    workerId: v.workerId,
    operationId: op.id,
    workDate: v.workDate,
    pieces: v.pieces,
    hours: v.hours !== undefined ? String(v.hours) : null,
    amountCents: v.pieces * rate,
  };
  const log = cmid
    ? (await ctx.tdb.insertIdempotent(productionLogs, { ...values, clientMutationId: cmid })).row
    : await ctx.tdb.insert(productionLogs, values);
  if (batch.status === "received") {
    await ctx.tdb.update(batches, { status: "in_production", version: batch.version + 1, updatedAt: new Date() }, eq(batches.id, batch.id));
  }
  return { log, duplicate: false };
}

/** Valor por peça de uma costureira (modelo e/ou máquina; vazio = qualquer). Substitui o que já existir para a mesma combinação. */
export async function setWorkerRateCore(ctx: Ctx, v: { workerId: string; machine: Machine | null; reference: string | null; pieceRateCents: number }) {
  requireWrite(ctx);
  requirePremium(ctx);
  await ctx.tdb.get(workers, eq(workers.id, v.workerId), "worker");
  const reference = v.reference?.trim() || null;
  const same = (await ctx.tdb.select(workerRates, eq(workerRates.workerId, v.workerId))).find(
    (r) => (r.machine ?? null) === v.machine && (r.reference ?? "").toLowerCase() === (reference ?? "").toLowerCase(),
  );
  if (same) {
    const [row] = await ctx.tdb.update(workerRates, { pieceRateCents: v.pieceRateCents, updatedAt: new Date() }, eq(workerRates.id, same.id));
    return row!;
  }
  return ctx.tdb.insert(workerRates, { workerId: v.workerId, machine: v.machine, reference, pieceRateCents: v.pieceRateCents });
}

export async function deleteWorkerRateCore(ctx: Ctx, id: string) {
  requireWrite(ctx);
  await ctx.tdb.get(workerRates, eq(workerRates.id, id), "worker_rate");
  await ctx.tdb.delete(workerRates, eq(workerRates.id, id));
}

export async function giveAdvanceCore(ctx: Ctx, v: AdvanceInput, cmid?: string) {
  if (cmid) {
    const existing = await ctx.tdb.first(advances, eq(advances.clientMutationId, cmid));
    if (existing) return { advance: existing, duplicate: true };
  }
  requireWrite(ctx);
  await ctx.tdb.get(workers, eq(workers.id, v.workerId), "worker");
  const values = { workerId: v.workerId, amountCents: v.amountCents, givenOn: v.givenOn, reason: v.reason ?? null };
  const advance = cmid
    ? (await ctx.tdb.insertIdempotent(advances, { ...values, clientMutationId: cmid })).row
    : await ctx.tdb.insert(advances, values);
  return { advance, duplicate: false };
}

/* ───── Acerto ───── */
export async function settlementPreviewCore(ctx: Ctx, workerId: string, period: { start: string; end: string }) {
  const worker = await ctx.tdb.get(workers, eq(workers.id, workerId), "worker");
  const rows = await ctx.tdb.query((db, s) =>
    db
      .select({ log: productionLogs, op: batchOperations, batch: { reference: batches.reference } })
      .from(productionLogs)
      .innerJoin(batchOperations, eq(batchOperations.id, productionLogs.operationId))
      .innerJoin(batches, eq(batches.id, productionLogs.batchId))
      .where(
        and(
          s(productionLogs),
          s(batchOperations),
          s(batches),
          eq(productionLogs.workerId, workerId),
          isNull(productionLogs.settlementId),
          lte(productionLogs.workDate, period.end),
        ),
      )
      .orderBy(asc(productionLogs.workDate)),
  );
  const pendingAdvances = await ctx.tdb.select(
    advances,
    and(eq(advances.workerId, workerId), isNull(advances.settlementId), lte(advances.givenOn, period.end)),
    { orderBy: asc(advances.givenOn) },
  );
  const settings = await ctx.tdb.first(workshopSettings);
  const minWage = await currentLegalParam("minimum_wage_monthly_cents", period.end);
  const result = computeSettlement({
    production: rows.map((r) => ({
      workDate: r.log.workDate,
      pieces: r.log.pieces,
      pieceRateCents: r.op.pieceRateCents,
      hours: r.log.hours ? Number(r.log.hours) : null,
    })),
    advancesCents: pendingAdvances.map((a) => a.amountCents),
    isEmployee: worker.isEmployee,
    minimumWageMonthlyCents: minWage?.valueCents ?? null,
    maxHoursPerDay: settings?.maxHoursPerDay ? Number(settings.maxHoursPerDay) : null,
  });
  return { worker, rows, advances: pendingAdvances, result, minWage };
}

export async function closeSettlementCore(ctx: Ctx, workerId: string, period: { start: string; end: string }) {
  requireWrite(ctx);
  const p = await settlementPreviewCore(ctx, workerId, period);
  if (p.rows.length === 0 && p.advances.length === 0) throw new DomainError("nothing_to_settle");
  return ctx.tdb.transaction(async (tx) => {
    const s = await tx.insert(settlements, {
      workerId,
      periodStart: period.start,
      periodEnd: period.end,
      grossCents: p.result.grossCents,
      advancesCents: p.result.advancesCents,
      adjustmentsCents: 0,
      netCents: p.result.netCents,
      daysWorked: p.result.daysWorked,
      belowMinWageFlag: p.result.belowMinWage,
      excessHoursFlag: p.result.excessHours,
      status: "review",
      publicToken: publicToken(),
    });
    await tx.insertMany(settlementItems, [
      ...p.rows.map((r) => ({
        settlementId: s.id,
        productionLogId: r.log.id,
        kind: "production" as const,
        description: [r.batch.reference, r.op.machine].filter(Boolean).join(" · "),
        pieces: r.log.pieces,
        amountCents: r.log.pieces * r.op.pieceRateCents,
      })),
      ...p.advances.map((a) => ({
        settlementId: s.id,
        advanceId: a.id,
        kind: "advance" as const,
        description: a.reason,
        pieces: null,
        amountCents: -a.amountCents,
      })),
    ]);
    if (p.rows.length) await tx.update(productionLogs, { settlementId: s.id }, inArray(productionLogs.id, p.rows.map((r) => r.log.id)));
    if (p.advances.length) await tx.update(advances, { settlementId: s.id }, inArray(advances.id, p.advances.map((a) => a.id)));
    return s;
  });
}

/** Reabre um acerto em revisão (corrigir apontamento). Pago não reabre. */
export async function reopenSettlementCore(ctx: Ctx, settlementId: string) {
  requireWrite(ctx);
  const s = await ctx.tdb.get(settlements, eq(settlements.id, settlementId), "settlement");
  if (s.status === "paid") throw new DomainError("settlement_locked");
  await ctx.tdb.transaction(async (tx) => {
    await tx.update(productionLogs, { settlementId: null }, eq(productionLogs.settlementId, s.id));
    await tx.update(advances, { settlementId: null }, eq(advances.settlementId, s.id));
    await tx.delete(settlementItems, eq(settlementItems.settlementId, s.id));
    await tx.delete(settlements, eq(settlements.id, s.id));
  });
}

export async function markSettlementPaidCore(ctx: Ctx, settlementId: string) {
  requireWrite(ctx);
  const s = await ctx.tdb.get(settlements, eq(settlements.id, settlementId), "settlement");
  if (s.status === "paid") throw new DomainError("settlement_locked");
  await ctx.tdb.update(settlements, { status: "paid", paidAt: new Date() }, eq(settlements.id, settlementId));
}

/** Ajuste de um acerto já pago: novo registro, nunca edição. amountCents > 0 = a pagar a mais. */
export async function createAdjustmentCore(ctx: Ctx, settlementId: string, amountCents: number, note: string) {
  requireWrite(ctx);
  const s = await ctx.tdb.get(settlements, eq(settlements.id, settlementId), "settlement");
  return ctx.tdb.transaction(async (tx) => {
    const adj = await tx.insert(settlements, {
      workerId: s.workerId,
      periodStart: s.periodStart,
      periodEnd: s.periodEnd,
      grossCents: 0,
      advancesCents: 0,
      adjustmentsCents: -amountCents,
      netCents: amountCents,
      daysWorked: 0,
      status: "review",
      adjustsSettlementId: s.id,
      publicToken: publicToken(),
    });
    await tx.insert(settlementItems, { settlementId: adj.id, kind: "adjustment", description: note, amountCents });
    return adj;
  });
}

/* ───── Entrega e prova ───── */
async function deliveredSoFar(ctx: Ctx, batchId: string): Promise<number> {
  const rows = await ctx.tdb.select(deliveryProofs, and(eq(deliveryProofs.batchId, batchId), isNull(deliveryProofs.revokedAt)));
  return rows.reduce((a, p) => a + p.quantity, 0);
}

export async function registerDeliveryCore(ctx: Ctx, v: DeliveryInput, previousProofId?: string) {
  requireWrite(ctx);
  const batch = await ctx.tdb.get(batches, eq(batches.id, v.batchId), "batch");
  const client = batch.clientId ? await ctx.tdb.first(clients, eq(clients.id, batch.clientId)) : undefined;
  const amountCents = v.quantity * batch.unitPriceCents - v.discountCents;
  if (amountCents < 0) throw new DomainError("discount_too_high");
  if (v.photoIds.length) {
    if ((await existingMediaIds(ctx, v.photoIds)).length !== new Set(v.photoIds).size) throw new DomainError("photo_not_found");
  }
  const prev = previousProofId ? await ctx.tdb.get(deliveryProofs, eq(deliveryProofs.id, previousProofId), "proof") : undefined;
  const version = prev ? prev.version + 1 : 1;
  const snapshot: ProofSnapshot = {
    v: 1,
    workshop: { name: ctx.workshop.name, city: ctx.workshop.city },
    client: { name: client?.name ?? "—" },
    batch: { reference: batch.reference, color: batch.color, unitPriceCents: batch.unitPriceCents, dueDate: batch.dueDate },
    delivery: {
      quantity: v.quantity,
      sizeGrid: (v.sizeGrid && Object.keys(v.sizeGrid).length ? v.sizeGrid : null) as SizeGrid | null,
      discountCents: v.discountCents,
      amountCents,
      note: v.note ?? null,
      deliveredAt: new Date().toISOString(),
      version,
    },
    photoIds: v.photoIds,
  };
  const contentSha256 = sha256Hex(canonicalJson(snapshot));
  const token = publicToken();
  const proof = await ctx.tdb.transaction(async (tx) => {
    const p = await tx.insert(deliveryProofs, {
      batchId: batch.id,
      version,
      previousProofId: prev?.id ?? null,
      quantity: v.quantity,
      sizeGrid: snapshot.delivery.sizeGrid,
      discountCents: v.discountCents,
      amountCents,
      photoIds: v.photoIds,
      note: v.note ?? null,
      snapshot,
      contentSha256,
      publicToken: token,
    });
    if (prev) {
      await tx.update(deliveryProofs, { revokedAt: new Date() }, eq(deliveryProofs.id, prev.id));
      await tx.update(
        receivables,
        { deliveryProofId: p.id, amountCents, status: "awaiting_confirmation", updatedAt: new Date() },
        eq(receivables.deliveryProofId, prev.id),
      );
    } else {
      await tx.insert(receivables, {
        clientId: batch.clientId,
        deliveryProofId: p.id,
        amountCents,
        issuedOn: todayISO(),
        dueOn: v.dueOn ?? null,
        status: "awaiting_confirmation",
      });
    }
    return p;
  });
  const total = await deliveredSoFar(ctx, batch.id);
  if (total >= batch.quantity && batch.status !== "delivered" && batch.status !== "closed") {
    await ctx.tdb.update(batches, { status: "delivered", version: batch.version + 1, updatedAt: new Date() }, eq(batches.id, batch.id));
  }
  return proof;
}

export async function revokeProofCore(ctx: Ctx, proofId: string) {
  const p = await ctx.tdb.get(deliveryProofs, eq(deliveryProofs.id, proofId), "proof");
  if (p.revokedAt) return;
  await ctx.tdb.update(deliveryProofs, { revokedAt: new Date() }, eq(deliveryProofs.id, proofId));
}

/** Taller assume o recebível sem confirmação (após X dias). */
export async function assumeReceivableCore(ctx: Ctx, receivableId: string) {
  await ctx.tdb.update(
    receivables,
    { status: "open", updatedAt: new Date() },
    and(eq(receivables.id, receivableId), eq(receivables.status, "awaiting_confirmation"))!,
  );
}

/* ───── Cobrança ───── */
export async function registerPaymentCore(ctx: Ctx, v: PaymentInput, cmid?: string) {
  if (cmid) {
    const existing = await ctx.tdb.first(payments, eq(payments.clientMutationId, cmid));
    if (existing) return { payment: existing, duplicate: true };
  }
  if (!ctx.access.canMarkPaid) throw new DomainError("read_only");
  return ctx.tdb.transaction(async (tx) => {
    const r = await tx.get(receivables, eq(receivables.id, v.receivableId), "receivable");
    if (r.status === "paid" || r.status === "written_off") throw new DomainError("receivable_closed");
    const remaining = r.amountCents - r.paidCents;
    const amount = Math.min(v.amountCents, remaining);
    const values = { receivableId: r.id, amountCents: amount, paidOn: v.paidOn, method: v.method, note: v.note ?? null };
    const payment = cmid ? (await tx.insertIdempotent(payments, { ...values, clientMutationId: cmid })).row : await tx.insert(payments, values);
    const paid = r.paidCents + amount;
    await tx.update(
      receivables,
      { paidCents: paid, status: paid >= r.amountCents ? "paid" : "partially_paid", updatedAt: new Date() },
      eq(receivables.id, r.id),
    );
    return { payment, duplicate: false };
  });
}

export async function writeOffCore(ctx: Ctx, receivableId: string) {
  requireWrite(ctx);
  await ctx.tdb.update(
    receivables,
    { status: "written_off", updatedAt: new Date() },
    and(eq(receivables.id, receivableId), inArray(receivables.status, ["open", "partially_paid", "disputed", "awaiting_confirmation"]))!,
  );
}

export async function markChargedCore(ctx: Ctx, receivableId: string) {
  await ctx.tdb.update(receivables, { lastChargedAt: new Date() }, eq(receivables.id, receivableId));
}

/* ───── Cliente recorrente ───── */
export async function setClientUsualServiceCore(ctx: Ctx, clientId: string, v: { reference: string | null; unitPriceCents: number | null }) {
  requireWrite(ctx);
  requirePremium(ctx);
  await ctx.tdb.get(clients, eq(clients.id, clientId), "client");
  await ctx.tdb.update(clients, { usualReference: v.reference?.trim() || null, usualUnitPriceCents: v.unitPriceCents, updatedAt: new Date() }, eq(clients.id, clientId));
}

/* ───── Cobrança agrupada (fechamento do período) ───── */
/**
 * Registra um pagamento recebido para várias entregas de um cliente de uma vez (Pix do período).
 * O valor quita da entrega mais antiga para a mais nova; o que sobrar não vira crédito.
 */
export async function payClientChargeCore(ctx: Ctx, v: { receivableIds: string[]; amountCents: number; paidOn: string; method: "pix" | "cash" | "other" }) {
  if (!ctx.access.canMarkPaid) throw new DomainError("read_only");
  requirePremium(ctx);
  return ctx.tdb.transaction(async (tx) => {
    const rows = await tx.select(receivables, inArray(receivables.id, v.receivableIds), { orderBy: [asc(receivables.issuedOn), asc(receivables.createdAt)] });
    if (rows.length !== v.receivableIds.length) throw new DomainError("not_found");
    if (new Set(rows.map((r) => r.clientId)).size > 1) throw new DomainError("validation");
    let left = v.amountCents;
    let applied = 0;
    for (const r of rows) {
      if (left <= 0) break;
      if (r.status === "paid" || r.status === "written_off") continue;
      const amount = Math.min(left, r.amountCents - r.paidCents);
      if (amount <= 0) continue;
      await tx.insert(payments, { receivableId: r.id, amountCents: amount, paidOn: v.paidOn, method: v.method, note: null });
      const paid = r.paidCents + amount;
      await tx.update(receivables, { paidCents: paid, status: paid >= r.amountCents ? "paid" : "partially_paid", updatedAt: new Date() }, eq(receivables.id, r.id));
      left -= amount;
      applied += amount;
    }
    if (applied === 0) throw new DomainError("receivable_closed");
    return { appliedCents: applied };
  });
}

export async function markChargedManyCore(ctx: Ctx, receivableIds: string[]) {
  if (!receivableIds.length) return;
  requirePremium(ctx);
  await ctx.tdb.update(receivables, { lastChargedAt: new Date() }, inArray(receivables.id, receivableIds));
}

/* ───── Facção ───── */
export async function createShipmentCore(
  ctx: Ctx,
  v: { batchId: string | null; partnerName: string; partnerPhone: string | null; reference: string | null; quantity: number; sentOn: string; dueOn: string | null; note: string | null },
) {
  requireWrite(ctx);
  requirePremium(ctx);
  let reference = v.reference?.trim() || null;
  if (v.batchId) {
    const b = await ctx.tdb.get(batches, eq(batches.id, v.batchId), "batch");
    reference = reference ?? b.reference;
  }
  return ctx.tdb.insert(outsourceShipments, {
    batchId: v.batchId,
    partnerName: v.partnerName.trim(),
    partnerPhoneE164: v.partnerPhone ? toE164(v.partnerPhone) : null,
    reference,
    quantity: v.quantity,
    sentOn: v.sentOn,
    dueOn: v.dueOn,
    note: v.note?.trim() || null,
  });
}

export async function markShipmentInProductionCore(ctx: Ctx, shipmentId: string) {
  requireWrite(ctx);
  requirePremium(ctx);
  await ctx.tdb.update(outsourceShipments, { status: "in_production", updatedAt: new Date() }, and(eq(outsourceShipments.id, shipmentId), eq(outsourceShipments.status, "sent"))!);
}

export async function registerReturnCore(ctx: Ctx, v: { shipmentId: string; returnedOn: string; goodQty: number; defectQty: number; missingQty: number; note: string | null }) {
  requireWrite(ctx);
  requirePremium(ctx);
  if (v.goodQty + v.defectQty + v.missingQty <= 0) throw new DomainError("validation");
  return ctx.tdb.transaction(async (tx) => {
    const sh = await tx.get(outsourceShipments, eq(outsourceShipments.id, v.shipmentId), "shipment");
    const prev = await tx.select(outsourceReturns, eq(outsourceReturns.shipmentId, sh.id));
    if (v.goodQty + v.defectQty + v.missingQty > maxReturnable(sh.quantity, prev)) throw new DomainError("return_exceeds_sent");
    const row = await tx.insert(outsourceReturns, { shipmentId: sh.id, returnedOn: v.returnedOn, goodQty: v.goodQty, defectQty: v.defectQty, missingQty: v.missingQty, note: v.note?.trim() || null });
    const all = [...prev, row];
    const status = shipmentStatus(sh.status, sh.quantity, all);
    await tx.update(outsourceShipments, { status, updatedAt: new Date() }, eq(outsourceShipments.id, sh.id));
    return { status, summary: summarizeShipment(sh.quantity, all) };
  });
}

export async function deleteReturnCore(ctx: Ctx, returnId: string) {
  requireWrite(ctx);
  requirePremium(ctx);
  await ctx.tdb.transaction(async (tx) => {
    const r = await tx.get(outsourceReturns, eq(outsourceReturns.id, returnId), "return");
    const sh = await tx.get(outsourceShipments, eq(outsourceShipments.id, r.shipmentId), "shipment");
    await tx.delete(outsourceReturns, eq(outsourceReturns.id, returnId));
    const rest = await tx.select(outsourceReturns, eq(outsourceReturns.shipmentId, sh.id));
    await tx.update(outsourceShipments, { status: shipmentStatus(sh.status, sh.quantity, rest), updatedAt: new Date() }, eq(outsourceShipments.id, sh.id));
  });
}

export async function deleteShipmentCore(ctx: Ctx, shipmentId: string) {
  requireWrite(ctx);
  requirePremium(ctx);
  await ctx.tdb.get(outsourceShipments, eq(outsourceShipments.id, shipmentId), "shipment");
  await ctx.tdb.delete(outsourceShipments, eq(outsourceShipments.id, shipmentId));
}

/* utilidades reexportadas para consultas */
export { desc, gte, sql };
