/**
 * Facção: peças enviadas para uma facção ou costureira externa e devolvidas.
 * Regras puras (sem banco) para o resumo de cada envio e o status do lote.
 */
import type { OutsourceStatus } from "@/db/schema";

export interface OutsourceReturnQty {
  goodQty: number;
  defectQty: number;
  missingQty: number;
}

export interface OutsourceSummary {
  sent: number;
  good: number;
  defect: number;
  /** declaradas como faltantes nos retornos */
  missing: number;
  /** ainda não voltaram nem foram dadas como faltantes */
  pending: number;
  /** diferença na hora: enviado − bom (o que não voltou bom: defeito + faltante + pendente) */
  difference: number;
}

export function summarizeShipment(quantity: number, returns: OutsourceReturnQty[]): OutsourceSummary {
  const good = returns.reduce((a, r) => a + r.goodQty, 0);
  const defect = returns.reduce((a, r) => a + r.defectQty, 0);
  const missing = returns.reduce((a, r) => a + r.missingQty, 0);
  return { sent: quantity, good, defect, missing, pending: Math.max(0, quantity - good - defect - missing), difference: quantity - good };
}

/**
 * Status do envio depois de um retorno (ou de marcar "em produção"):
 * tudo contado (bom + defeito + faltante = enviado) → devolvido; algum retorno → devolvido parcial;
 * sem retorno mantém enviado / em produção.
 */
export function shipmentStatus(current: OutsourceStatus, quantity: number, returns: OutsourceReturnQty[]): OutsourceStatus {
  if (!returns.length) return current === "partial" || current === "returned" ? "sent" : current;
  return summarizeShipment(quantity, returns).pending === 0 ? "returned" : "partial";
}

/** Quanto ainda cabe num retorno novo (não deixa devolver mais do que foi enviado). */
export function maxReturnable(quantity: number, returns: OutsourceReturnQty[]): number {
  return summarizeShipment(quantity, returns).pending;
}

/** Envio atrasado: passou do prazo e ainda há peças pendentes. */
export function isOverdue(dueOn: string | null, pending: number, todayISO: string): boolean {
  return Boolean(dueOn && pending > 0 && dueOn < todayISO);
}
