/**
 * Fila offline idempotente: POST { mutations: [...] } (até 50).
 * Para cada client_mutation_id: se já processada → {status:'duplicate', serverId};
 * se nova → aplica e grava em offline_sync_queue → {status:'applied', serverId};
 * se inválida → {status:'rejected', error}.
 */
import { eq } from "drizzle-orm";
import { offlineSyncQueue } from "@/db/schema";
import { workshopFromRequest } from "@/lib/session";
import {
  advanceSchema,
  batchCreateSchema,
  clientCreateSchema,
  paymentSchema,
  productionLogSchema,
  syncRequestSchema,
  workerCreateSchema,
  type SyncMutation,
} from "@/lib/schemas";
import {
  DomainError,
  createBatchCore,
  createClientCore,
  createWorkerCore,
  giveAdvanceCore,
  logProductionCore,
  registerPaymentCore,
} from "@/server/core";
import { hitRateLimit } from "@/db/public";
import { TenantNotFoundError } from "@/db/tenant";
import type { WorkshopContext } from "@/lib/session";
import { revalidatePath } from "next/cache";

type Outcome = { clientMutationId: string; status: "applied" | "duplicate" | "rejected"; serverId?: string; error?: string };

async function apply(ctx: WorkshopContext, m: SyncMutation): Promise<{ serverId: string; duplicate: boolean }> {
  const cmid = m.clientMutationId;
  switch (m.type) {
    case "batch.create": {
      const r = await createBatchCore(ctx, batchCreateSchema.parse(m.payload), cmid);
      return { serverId: r.batch.id, duplicate: r.duplicate };
    }
    case "client.create": {
      const r = await createClientCore(ctx, clientCreateSchema.parse(m.payload), cmid);
      return { serverId: r.id, duplicate: false };
    }
    case "worker.create": {
      const r = await createWorkerCore(ctx, workerCreateSchema.parse(m.payload), cmid);
      return { serverId: r.id, duplicate: false };
    }
    case "production.log": {
      const r = await logProductionCore(ctx, productionLogSchema.parse(m.payload), cmid);
      return { serverId: r.log.id, duplicate: r.duplicate };
    }
    case "advance.create": {
      const r = await giveAdvanceCore(ctx, advanceSchema.parse(m.payload), cmid);
      return { serverId: r.advance.id, duplicate: r.duplicate };
    }
    case "payment.create": {
      const r = await registerPaymentCore(ctx, paymentSchema.parse(m.payload), cmid);
      return { serverId: r.payment.id, duplicate: r.duplicate };
    }
  }
}

export async function POST(req: Request) {
  const ctx = await workshopFromRequest();
  if (!ctx) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (await hitRateLimit(`sync:${ctx.workshop.id}`, 120, 60)) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }
  const parsed = syncRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid", issues: parsed.error.issues.slice(0, 5) }, { status: 400 });

  const results: Outcome[] = [];
  for (const m of parsed.data.mutations) {
    const seen = await ctx.tdb.first(offlineSyncQueue, eq(offlineSyncQueue.clientMutationId, m.clientMutationId));
    if (seen) {
      results.push({
        clientMutationId: m.clientMutationId,
        status: seen.status === "rejected" ? "rejected" : "duplicate",
        serverId: seen.serverEntityId ?? undefined,
        error: seen.error ?? undefined,
      });
      continue;
    }
    try {
      const r = await apply(ctx, m);
      await ctx.tdb.insert(offlineSyncQueue, {
        clientMutationId: m.clientMutationId,
        userId: ctx.user.id,
        entity: m.type.split(".")[0]!,
        op: "create",
        serverEntityId: r.serverId,
        status: "applied",
        clientCreatedAt: m.clientCreatedAt ? new Date(m.clientCreatedAt) : null,
      });
      results.push({ clientMutationId: m.clientMutationId, status: r.duplicate ? "duplicate" : "applied", serverId: r.serverId });
    } catch (err) {
      const code =
        err instanceof DomainError
          ? err.code
          : err instanceof TenantNotFoundError
            ? "not_found"
            : err && typeof err === "object" && "issues" in err
              ? "validation"
              : "server_error";
      if (code === "server_error") console.error(JSON.stringify({ level: "error", msg: "sync_apply_failed", type: m.type, err: String(err) }));
      // Erros de regra ficam registrados (não reprocessa); erro de servidor permite retry.
      if (code !== "server_error") {
        await ctx.tdb
          .insert(offlineSyncQueue, {
            clientMutationId: m.clientMutationId,
            userId: ctx.user.id,
            entity: m.type.split(".")[0]!,
            op: "create",
            status: "rejected",
            error: code,
            clientCreatedAt: m.clientCreatedAt ? new Date(m.clientCreatedAt) : null,
          })
          .catch(() => undefined);
      }
      results.push({ clientMutationId: m.clientMutationId, status: "rejected", error: code });
    }
  }
  revalidatePath("/[locale]", "layout");
  return Response.json({ results });
}
