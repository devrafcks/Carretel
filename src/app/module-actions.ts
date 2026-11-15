"use server";
/**
 * Server Actions dos módulos da v2: folha por peça (valor por costureira), cliente recorrente,
 * cobrança agrupada por período e facção. Mesmo padrão de src/app/actions.ts: sessão + oficina + zod.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireWorkshop } from "@/lib/session";
import { TenantNotFoundError } from "@/db/tenant";
import {
  DomainError,
  createShipmentCore,
  deleteReturnCore,
  deleteShipmentCore,
  deleteWorkerRateCore,
  markChargedManyCore,
  markShipmentInProductionCore,
  payClientChargeCore,
  registerReturnCore,
  setClientUsualServiceCore,
  setWorkerRateCore,
} from "@/server/core";
import type { ActionResult } from "./actions";

const uuid = z.uuid();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const cents = z.number().int().min(1).max(1_000_000_000);
const qty = z.number().int().min(0).max(1_000_000);
const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

function fail(err: unknown): { ok: false; error: string; field?: string } {
  if (err instanceof DomainError) return { ok: false, error: err.code };
  if (err instanceof TenantNotFoundError) return { ok: false, error: "not_found" };
  if (err instanceof z.ZodError) return { ok: false, error: "validation", field: err.issues[0]?.path.join(".") };
  console.error(JSON.stringify({ level: "error", msg: "module_action_failed", err: String((err as Error)?.message ?? err) }));
  return { ok: false, error: "server_error" };
}

function done() {
  revalidatePath("/[locale]", "layout");
}

/* ───── Folha por peça ───── */
const rateSchema = z.object({
  workerId: uuid,
  machine: z.enum(["recta", "overlock", "collareta", "interlock", "other"]).nullable(),
  reference: optText(80),
  pieceRateCents: cents,
});

export async function setWorkerRateAction(input: z.input<typeof rateSchema>): Promise<ActionResult> {
  try {
    const ctx = await requireWorkshop();
    await setWorkerRateCore(ctx, rateSchema.parse(input));
    done();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteWorkerRateAction(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkshop();
    await deleteWorkerRateCore(ctx, uuid.parse(id));
    done();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/* ───── Cliente recorrente ───── */
const usualSchema = z.object({ reference: optText(80), unitPriceCents: cents.nullable() });

export async function setClientUsualServiceAction(clientId: string, input: z.input<typeof usualSchema>): Promise<ActionResult> {
  try {
    const ctx = await requireWorkshop();
    await setClientUsualServiceCore(ctx, uuid.parse(clientId), usualSchema.parse(input));
    done();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/* ───── Cobrança agrupada ───── */
const chargePaySchema = z.object({
  receivableIds: z.array(uuid).min(1).max(200),
  amountCents: cents,
  paidOn: isoDate,
  method: z.enum(["pix", "cash", "other"]).default("pix"),
});

export async function payClientChargeAction(input: z.input<typeof chargePaySchema>): Promise<ActionResult<{ appliedCents: number }>> {
  try {
    const ctx = await requireWorkshop();
    const r = await payClientChargeCore(ctx, chargePaySchema.parse(input));
    done();
    return { ok: true, data: r };
  } catch (e) {
    return fail(e);
  }
}

export async function markChargedManyAction(receivableIds: string[]): Promise<ActionResult> {
  try {
    const ctx = await requireWorkshop();
    await markChargedManyCore(ctx, z.array(uuid).max(200).parse(receivableIds));
    done();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/* ───── Facção ───── */
const shipmentSchema = z
  .object({
    batchId: uuid.nullable().optional().transform((v) => v ?? null),
    partnerName: z.string().trim().min(1).max(120),
    partnerPhone: optText(30),
    reference: optText(80),
    quantity: z.number().int().min(1).max(1_000_000),
    sentOn: isoDate,
    dueOn: isoDate.nullable().optional().transform((v) => v ?? null),
    note: optText(300),
  })
  .refine((v) => !v.dueOn || v.dueOn >= v.sentOn, { path: ["dueOn"], message: "due_before_sent" });

export async function createShipmentAction(input: z.input<typeof shipmentSchema>): Promise<ActionResult<{ id: string }>> {
  try {
    const ctx = await requireWorkshop();
    const row = await createShipmentCore(ctx, shipmentSchema.parse(input));
    done();
    return { ok: true, data: { id: row.id } };
  } catch (e) {
    return fail(e);
  }
}

export async function markShipmentInProductionAction(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkshop();
    await markShipmentInProductionCore(ctx, uuid.parse(id));
    done();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

const returnSchema = z.object({
  shipmentId: uuid,
  returnedOn: isoDate,
  goodQty: qty,
  defectQty: qty,
  missingQty: qty,
  note: optText(300),
});

export async function registerReturnAction(input: z.input<typeof returnSchema>): Promise<ActionResult<{ status: string; difference: number; pending: number }>> {
  try {
    const ctx = await requireWorkshop();
    const r = await registerReturnCore(ctx, returnSchema.parse(input));
    done();
    return { ok: true, data: { status: r.status, difference: r.summary.difference, pending: r.summary.pending } };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteReturnAction(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkshop();
    await deleteReturnCore(ctx, uuid.parse(id));
    done();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteShipmentAction(id: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkshop();
    await deleteShipmentCore(ctx, uuid.parse(id));
    done();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
