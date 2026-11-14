import { beforeAll, describe, expect, it } from "vitest";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { tenantDbFrom, TenantNotFoundError } from "@/db/tenant";
import type { DB } from "@/db/client";
import {
  createBatchCore,
  registerDeliveryCore,
  registerPaymentCore,
  logProductionCore,
  createWorkerCore,
  closeSettlementCore,
  markSettlementPaidCore,
} from "@/server/core";
import type { Access } from "@/lib/subscription";

let db: DB;
let wsA: string;
let wsB: string;

const fullAccess: Access = { canWrite: true, canCreateBatch: true, canMarkPaid: true, reason: "ok", freeRemaining: 3 };

function ctxFor(id: string, name: string) {
  return {
    tdb: tenantDbFrom(db, id),
    workshop: { id, name, city: "São Paulo", planStatus: "active" } as never,
    access: fullAccess,
    user: { id: "u_" + name, email: name + "@exemplo.test", name },
  };
}

beforeAll(async () => {
  const client = new PGlite();
  const d = drizzle(client, { schema });
  await migrate(d, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  db = d as unknown as DB;
  const [a] = await db.insert(schema.workshops).values({ name: "Taller Rosa", planStatus: "active" }).returning();
  const [b] = await db.insert(schema.workshops).values({ name: "Taller Sol", planStatus: "active" }).returning();
  wsA = a!.id;
  wsB = b!.id;
});

describe("isolamento multi-tenant", () => {
  it("oficina B não lê, não altera e não apaga dados da oficina A", async () => {
    const A = ctxFor(wsA, "rosa");
    const B = ctxFor(wsB, "sol");
    const { batch } = await createBatchCore(A, {
      quantity: 300,
      unitPriceCents: 300,
      photoIds: [],
      operations: [],
      suppliesBy: "client",
      newClientName: "Carlos",
    });
    expect(await A.tdb.first(schema.batches, eq(schema.batches.id, batch.id))).toBeTruthy();
    expect(await B.tdb.first(schema.batches, eq(schema.batches.id, batch.id))).toBeUndefined();
    expect(await B.tdb.select(schema.batches)).toHaveLength(0);
    await expect(B.tdb.get(schema.batches, eq(schema.batches.id, batch.id))).rejects.toBeInstanceOf(TenantNotFoundError);
    const updated = await B.tdb.update(schema.batches, { quantity: 1 }, eq(schema.batches.id, batch.id));
    expect(updated).toHaveLength(0);
    expect(await B.tdb.delete(schema.batches, eq(schema.batches.id, batch.id))).toBe(0);
    // insert com workshopId forjado é sobrescrito pelo tenant
    const forged = await B.tdb.insert(schema.clients, { name: "X", workshopId: wsA } as never);
    expect(forged.workshopId).toBe(wsB);
    // B não registra produção num lote de A
    const w = await createWorkerCore(B, { name: "Juan", isEmployee: false });
    await expect(
      logProductionCore(B, { workerId: w.id, batchId: batch.id, machine: "recta", pieceRateCents: 40, pieces: 10, workDate: "2026-11-13" }),
    ).rejects.toBeInstanceOf(TenantNotFoundError);
  });
});

describe("idempotência", () => {
  it("mesmo client_mutation_id não duplica o lote", async () => {
    const A = ctxFor(wsA, "rosa");
    const cmid = "0194f3c0-0000-7000-8000-000000000001";
    const input = { quantity: 10, unitPriceCents: 100, photoIds: [], operations: [], suppliesBy: "client" as const };
    const r1 = await createBatchCore(A, input, cmid);
    const r2 = await createBatchCore(A, input, cmid);
    expect(r1.duplicate).toBe(false);
    expect(r2.duplicate).toBe(true);
    expect(r2.batch.id).toBe(r1.batch.id);
  });
});

describe("prova de entrega, cobrança e imutabilidade", () => {
  it("entrega → confirmação → snapshot travado no banco → baixa parcial e total", async () => {
    const A = ctxFor(wsA, "rosa");
    const { batch } = await createBatchCore(A, {
      quantity: 300,
      unitPriceCents: 300,
      sizeGrid: { P: 80, M: 120, G: 100 },
      photoIds: [],
      operations: [],
      suppliesBy: "client",
      newClientName: "Carlos",
      reference: "1234",
    });
    const proof = await registerDeliveryCore(A, { batchId: batch.id, quantity: 300, sizeGrid: { P: 80, M: 120, G: 100 }, discountCents: 0, photoIds: [] });
    expect(proof.amountCents).toBe(90000);
    expect(proof.contentSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(proof.publicToken).toMatch(/^[A-Za-z0-9_-]{22}$/);

    // snapshot é imutável mesmo antes da confirmação
    await expect(
      db.update(schema.deliveryProofs).set({ snapshot: { ...proof.snapshot, client: { name: "Outro" } } }).where(eq(schema.deliveryProofs.id, proof.id)),
    ).rejects.toThrow();

    await db.update(schema.deliveryProofs).set({ confirmedAt: new Date(), confirmedName: "Carlos" }).where(eq(schema.deliveryProofs.id, proof.id));
    await expect(
      db.update(schema.deliveryProofs).set({ quantity: 1 }).where(eq(schema.deliveryProofs.id, proof.id)),
    ).rejects.toThrow();
    await expect(
      db.update(schema.deliveryProofs).set({ amountCents: 1 }).where(eq(schema.deliveryProofs.id, proof.id)),
    ).rejects.toThrow();

    const [rec] = await A.tdb.select(schema.receivables, eq(schema.receivables.deliveryProofId, proof.id));
    expect(rec!.status).toBe("awaiting_confirmation");
    await registerPaymentCore(A, { receivableId: rec!.id, amountCents: 40000, paidOn: "2026-11-14", method: "pix" });
    let [r2] = await A.tdb.select(schema.receivables, eq(schema.receivables.id, rec!.id));
    expect(r2!.status).toBe("partially_paid");
    expect(r2!.paidCents).toBe(40000);
    await registerPaymentCore(A, { receivableId: rec!.id, amountCents: 99999, paidOn: "2026-11-14", method: "cash" });
    [r2] = await A.tdb.select(schema.receivables, eq(schema.receivables.id, rec!.id));
    expect(r2!.status).toBe("paid");
    expect(r2!.paidCents).toBe(90000);
  });

  it("acerto pago é imutável no banco", async () => {
    const A = ctxFor(wsA, "rosa");
    const w = await createWorkerCore(A, { name: "Juan", isEmployee: true });
    const { batch } = await createBatchCore(A, { quantity: 100, unitPriceCents: 300, photoIds: [], operations: [], suppliesBy: "client" });
    await logProductionCore(A, { workerId: w.id, batchId: batch.id, machine: "overlock", pieceRateCents: 40, pieces: 100, workDate: "2026-11-12" });
    const s = await closeSettlementCore(A, w.id, { start: "2026-11-08", end: "2026-11-14" });
    expect(s.grossCents).toBe(4000);
    await markSettlementPaidCore(A, s.id);
    await expect(db.update(schema.settlements).set({ netCents: 1 }).where(eq(schema.settlements.id, s.id))).rejects.toThrow();
  });
});
