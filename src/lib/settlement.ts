/**
 * Acerto semanal por pessoa: Σ(peças × valor da operação) − Σ adelantos − descontos = a pagar.
 * Alerta educativo CLT art. 78 (não bloqueia): valor/dia < salário mínimo mensal ÷ 30.
 * O salário mínimo vem de legal_params (com data de vigência e fonte) — nunca fixo no código.
 */
import type { Cents } from "./money";

export interface ProductionEntry {
  workDate: string; // YYYY-MM-DD
  pieces: number;
  pieceRateCents: Cents;
  hours?: number | null;
}

export interface SettlementInput {
  production: ProductionEntry[];
  advancesCents: Cents[];
  adjustmentsCents?: Cents; // descontos de arreglo (positivo = desconta)
  isEmployee: boolean;
  minimumWageMonthlyCents: Cents | null;
  maxHoursPerDay?: number | null;
}

export interface SettlementResult {
  grossCents: Cents;
  advancesCents: Cents;
  adjustmentsCents: Cents;
  netCents: Cents;
  daysWorked: number;
  perDayCents: Cents;
  dailyFloorCents: Cents | null;
  belowMinWage: boolean;
  excessHours: boolean;
  piecesTotal: number;
}

export function lineAmount(pieces: number, pieceRateCents: Cents): Cents {
  if (!Number.isInteger(pieces) || pieces < 0) throw new Error("pieces inválido");
  return pieces * pieceRateCents;
}

export function dailyFloor(minimumWageMonthlyCents: Cents): Cents {
  // Piso diário = mensal ÷ 30 (regra a confirmar com o contador)
  return Math.ceil(minimumWageMonthlyCents / 30);
}

export function computeSettlement(input: SettlementInput): SettlementResult {
  const grossCents = input.production.reduce((acc, p) => acc + lineAmount(p.pieces, p.pieceRateCents), 0);
  const advancesCents = input.advancesCents.reduce((a, b) => a + b, 0);
  const adjustmentsCents = input.adjustmentsCents ?? 0;
  const netCents = grossCents - advancesCents - adjustmentsCents;
  const days = new Set(input.production.filter((p) => p.pieces > 0).map((p) => p.workDate));
  const daysWorked = days.size;
  const perDayCents = daysWorked > 0 ? Math.floor(grossCents / daysWorked) : 0;
  const dailyFloorCents = input.minimumWageMonthlyCents ? dailyFloor(input.minimumWageMonthlyCents) : null;
  const belowMinWage = Boolean(
    input.isEmployee && dailyFloorCents !== null && daysWorked > 0 && perDayCents < dailyFloorCents,
  );
  const hoursByDay = new Map<string, number>();
  for (const p of input.production) {
    if (p.hours) hoursByDay.set(p.workDate, (hoursByDay.get(p.workDate) ?? 0) + p.hours);
  }
  const excessHours = Boolean(
    input.maxHoursPerDay && [...hoursByDay.values()].some((h) => h > (input.maxHoursPerDay as number)),
  );
  const piecesTotal = input.production.reduce((a, p) => a + p.pieces, 0);
  return {
    grossCents,
    advancesCents,
    adjustmentsCents,
    netCents,
    daysWorked,
    perDayCents,
    dailyFloorCents,
    belowMinWage,
    excessHours,
    piecesTotal,
  };
}

/** Período de acerto que termina no dia configurado (padrão sábado). */
export function settlementPeriod(today: Date, endWeekday = 6, lengthDays = 7): { start: string; end: string } {
  const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const diff = (endWeekday - d.getUTCDay() + 7) % 7;
  const end = new Date(d);
  end.setUTCDate(d.getUTCDate() + diff);
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - (lengthDays - 1));
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}
