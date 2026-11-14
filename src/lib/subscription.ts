/**
 * Máquina de estados da assinatura (AbacatePay v2) e regras de acesso.
 * free → pending_checkout → trialing | active → past_due | canceled → read_only
 */
import type { PlanStatus } from "@/db/schema";

export type SubscriptionEventType =
  | "subscription.completed"
  | "subscription.trial_started"
  | "subscription.renewed"
  | "subscription.payment_failed"
  | "subscription.plan_changed"
  | "subscription.cancelled"
  | "checkout.completed"
  | "local.checkout_opened"
  | "local.period_expired"
  | "local.free_limit_reached"
  | "local.renew";

export function nextPlanStatus(current: PlanStatus, event: SubscriptionEventType): PlanStatus {
  switch (event) {
    case "local.checkout_opened":
    case "local.renew":
      return current === "active" || current === "trialing" ? current : "pending_checkout";
    case "subscription.completed":
      return "active";
    case "subscription.trial_started":
      return "trialing";
    case "subscription.renewed":
      return "active";
    case "subscription.payment_failed":
      return current === "active" || current === "trialing" || current === "past_due" ? "past_due" : current;
    case "subscription.cancelled":
      return current === "read_only" ? "read_only" : "canceled";
    case "subscription.plan_changed":
    case "checkout.completed":
      return current === "pending_checkout" ? "active" : current;
    case "local.period_expired":
      return current === "past_due" || current === "canceled" ? "read_only" : current;
    case "local.free_limit_reached":
      return current === "free" || current === "pending_checkout" ? "read_only" : current;
    default:
      return current;
  }
}

export interface AccessInput {
  planStatus: PlanStatus;
  freeBatchesUsed: number;
  freeStartedAt: Date;
  currentPeriodEnd?: Date | null;
  now?: Date;
  freeBatchLimit: number;
  freeDaysLimit: number;
}

export interface Access {
  canWrite: boolean;
  canCreateBatch: boolean;
  canMarkPaid: boolean;
  reason: "ok" | "free_exhausted" | "read_only" | "past_due_grace";
  freeRemaining: number;
}

export function computeAccess(i: AccessInput): Access {
  const now = i.now ?? new Date();
  const freeExpired = now.getTime() - i.freeStartedAt.getTime() > i.freeDaysLimit * 86_400_000;
  const freeRemaining = Math.max(0, i.freeBatchLimit - i.freeBatchesUsed);
  switch (i.planStatus) {
    case "active":
    case "trialing":
      return { canWrite: true, canCreateBatch: true, canMarkPaid: true, reason: "ok", freeRemaining };
    case "past_due":
    case "canceled": {
      const stillPaid = i.currentPeriodEnd ? i.currentPeriodEnd.getTime() > now.getTime() : false;
      return stillPaid
        ? { canWrite: true, canCreateBatch: true, canMarkPaid: true, reason: "past_due_grace", freeRemaining }
        : { canWrite: false, canCreateBatch: false, canMarkPaid: true, reason: "read_only", freeRemaining };
    }
    case "read_only":
      return { canWrite: false, canCreateBatch: false, canMarkPaid: true, reason: "read_only", freeRemaining };
    case "free":
    case "pending_checkout":
    default: {
      // 3 lotes completos (receber → entregar → cobrar): esgotar a cota só bloqueia o 4º lote;
      // passar dos 30 dias bloqueia a escrita (modo leitura), mas nunca o "Registrar pago".
      const exhausted = freeRemaining === 0 || freeExpired;
      return {
        canWrite: !freeExpired,
        canCreateBatch: !exhausted,
        canMarkPaid: true,
        reason: exhausted ? "free_exhausted" : "ok",
        freeRemaining: freeExpired ? 0 : freeRemaining,
      };
    }
  }
}

/** Janela de arrependimento (CDC art. 49 — conferir via leis-mcp): 7 dias após a 1ª cobrança. */
export function withinRefundWindow(firstChargedAt: Date | null | undefined, now = new Date()): boolean {
  if (!firstChargedAt) return false;
  return now.getTime() - firstChargedAt.getTime() <= 7 * 86_400_000;
}
