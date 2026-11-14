import { describe, expect, it } from "vitest";
import { computeAccess, nextPlanStatus, withinRefundWindow } from "@/lib/subscription";
import type { PlanStatus } from "@/db/schema";

describe("máquina de estados da assinatura", () => {
  it("freemium → paywall → completed → renovação → falha → read_only → renovar", () => {
    let s: PlanStatus = "free";
    s = nextPlanStatus(s, "local.checkout_opened");
    expect(s).toBe("pending_checkout");
    s = nextPlanStatus(s, "subscription.completed");
    expect(s).toBe("active");
    s = nextPlanStatus(s, "subscription.renewed");
    expect(s).toBe("active");
    s = nextPlanStatus(s, "subscription.payment_failed");
    expect(s).toBe("past_due");
    s = nextPlanStatus(s, "local.period_expired");
    expect(s).toBe("read_only");
    s = nextPlanStatus(s, "local.renew");
    expect(s).toBe("pending_checkout");
  });

  it("trial só no cartão: trial_started → renewed = active", () => {
    expect(nextPlanStatus(nextPlanStatus("pending_checkout", "subscription.trial_started"), "subscription.renewed")).toBe(
      "active",
    );
  });

  it("cancelado mantém acesso até o fim do período e depois vira read_only", () => {
    expect(nextPlanStatus("active", "subscription.cancelled")).toBe("canceled");
    expect(nextPlanStatus("canceled", "local.period_expired")).toBe("read_only");
  });
});

describe("acesso", () => {
  const base = { freeBatchLimit: 3, freeDaysLimit: 30, freeStartedAt: new Date("2026-11-10T00:00:00Z") };
  const now = new Date("2026-11-14T00:00:00Z");
  it("free com lotes restantes escreve", () => {
    const a = computeAccess({ ...base, planStatus: "free", freeBatchesUsed: 1, now });
    expect(a.canCreateBatch).toBe(true);
    expect(a.freeRemaining).toBe(2);
  });
  it("free esgotado bloqueia novos lotes mas libera Registrar pago", () => {
    const a = computeAccess({ ...base, planStatus: "free", freeBatchesUsed: 3, now });
    expect(a.canCreateBatch).toBe(false);
    expect(a.canMarkPaid).toBe(true);
    expect(a.reason).toBe("free_exhausted");
  });
  it("free vence em 30 dias", () => {
    const a = computeAccess({ ...base, planStatus: "free", freeBatchesUsed: 0, now: new Date("2026-12-20T00:00:00Z") });
    expect(a.canCreateBatch).toBe(false);
  });
  it("modo leitura nunca sequestra: lê e registra pago", () => {
    const a = computeAccess({ ...base, planStatus: "read_only", freeBatchesUsed: 3, now });
    expect(a.canWrite).toBe(false);
    expect(a.canMarkPaid).toBe(true);
  });
  it("arrependimento em 7 dias", () => {
    expect(withinRefundWindow(new Date("2026-11-10T00:00:00Z"), now)).toBe(true);
    expect(withinRefundWindow(new Date("2026-11-01T00:00:00Z"), now)).toBe(false);
  });
});
