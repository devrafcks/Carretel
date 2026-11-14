/**
 * Calculadora "Esse corte dá lucro ou prejuízo?" — tudo em centavos, no cliente.
 *  minutos_mes = pessoas × horas_dia × 60 × dias_mes
 *  custo_minuto = (custo_fixo_mes + folha_estimada_mes) / minutos_mes
 *  custo_peca = custo_minuto × minutos_por_peca
 *  margem_lote = (preco_oferecido − custo_peca) × quantidade
 *  pecas_hora_empate = 60 × custo_minuto / preco_oferecido
 * Preço mínimo saudável = custo + margem alvo (padrão 20% — hipótese).
 */
export interface CalcInput {
  fixedMonthlyCents: number;
  payrollMonthlyCents: number;
  people: number;
  hoursPerDay: number;
  daysPerMonth: number;
  /** Ritmo: peças por hora (por pessoa) OU minutos por peça */
  piecesPerHour?: number;
  minutesPerPiece?: number;
  offeredPriceCents: number;
  quantity: number;
  marginPct?: number;
}

export type CalcError = "people" | "hoursPerDay" | "daysPerMonth" | "pace" | "offeredPrice" | "quantity";

export interface CalcResult {
  minutesPerMonth: number;
  costPerMinuteCents: number; // fracionário (centavos com decimais)
  minutesPerPiece: number;
  costPerPieceCents: number; // arredondado
  minHealthyPriceCents: number;
  batchMarginCents: number;
  piecesPerHourToBreakEven: number;
  missingPerPieceCents: number; // > 0 se dá prejuízo
  profitable: boolean;
}

export const DEFAULT_MARGIN_PCT = 20;

export function validateCalc(i: CalcInput): CalcError | null {
  if (!(i.people > 0)) return "people";
  if (!(i.hoursPerDay > 0)) return "hoursPerDay";
  if (!(i.daysPerMonth > 0)) return "daysPerMonth";
  const pace = i.minutesPerPiece ?? (i.piecesPerHour ? 60 / i.piecesPerHour : undefined);
  if (!pace || !(pace > 0) || !Number.isFinite(pace)) return "pace";
  if (!(i.offeredPriceCents > 0)) return "offeredPrice";
  if (!(i.quantity > 0)) return "quantity";
  return null;
}

export function calculate(i: CalcInput): CalcResult {
  const minutesPerMonth = i.people * i.hoursPerDay * 60 * i.daysPerMonth;
  const costPerMinuteCents = (i.fixedMonthlyCents + i.payrollMonthlyCents) / minutesPerMonth;
  const minutesPerPiece = i.minutesPerPiece ?? 60 / (i.piecesPerHour as number);
  const costPerPieceExact = costPerMinuteCents * minutesPerPiece;
  const costPerPieceCents = Math.round(costPerPieceExact);
  const margin = i.marginPct ?? DEFAULT_MARGIN_PCT;
  const minHealthyPriceCents = Math.ceil(costPerPieceExact * (1 + margin / 100));
  const batchMarginCents = Math.round((i.offeredPriceCents - costPerPieceExact) * i.quantity);
  const piecesPerHourToBreakEven = (60 * costPerMinuteCents) / i.offeredPriceCents;
  const missingPerPieceCents = Math.max(0, Math.ceil(costPerPieceExact - i.offeredPriceCents));
  return {
    minutesPerMonth,
    costPerMinuteCents,
    minutesPerPiece,
    costPerPieceCents,
    minHealthyPriceCents,
    batchMarginCents,
    piecesPerHourToBreakEven,
    missingPerPieceCents,
    profitable: batchMarginCents >= 0,
  };
}

export const CALC_EXAMPLE: CalcInput = {
  fixedMonthlyCents: 250000,
  payrollMonthlyCents: 600000,
  people: 4,
  hoursPerDay: 9,
  daysPerMonth: 22,
  piecesPerHour: 12,
  offeredPriceCents: 300,
  quantity: 300,
  marginPct: DEFAULT_MARGIN_PCT,
};
