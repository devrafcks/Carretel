import { describe, expect, it } from "vitest";
import { calculate, validateCalc, CALC_EXAMPLE } from "@/lib/calculator";

describe("calculadora", () => {
  it("fórmulas em centavos", () => {
    const r = calculate({
      fixedMonthlyCents: 300000,
      payrollMonthlyCents: 0,
      people: 1,
      hoursPerDay: 10,
      daysPerMonth: 25,
      minutesPerPiece: 5,
      offeredPriceCents: 150,
      quantity: 300,
    });
    expect(r.minutesPerMonth).toBe(15000);
    expect(r.costPerMinuteCents).toBeCloseTo(20);
    expect(r.costPerPieceCents).toBe(100);
    expect(r.batchMarginCents).toBe(15000);
    expect(r.minHealthyPriceCents).toBe(120);
    expect(r.piecesPerHourToBreakEven).toBeCloseTo(8);
    expect(r.profitable).toBe(true);
  });

  it("prejuízo e quanto falta por peça", () => {
    const r = calculate({ ...CALC_EXAMPLE, offeredPriceCents: 50 });
    expect(r.profitable).toBe(false);
    expect(r.missingPerPieceCents).toBeGreaterThan(0);
  });

  it("valida horas por dia > 0", () => {
    expect(validateCalc({ ...CALC_EXAMPLE, hoursPerDay: 0 })).toBe("hoursPerDay");
    expect(validateCalc(CALC_EXAMPLE)).toBeNull();
  });
});
