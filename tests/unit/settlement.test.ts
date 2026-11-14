import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { computeSettlement, dailyFloor, settlementPeriod } from "@/lib/settlement";

describe("acerto", () => {
  it("exemplo canônico: produção R$ 520 − adelantos R$ 100 = R$ 420", () => {
    const r = computeSettlement({
      production: [
        { workDate: "2026-11-09", pieces: 400, pieceRateCents: 40 },
        { workDate: "2026-11-10", pieces: 900, pieceRateCents: 40 },
      ],
      advancesCents: [5000, 5000],
      isEmployee: false,
      minimumWageMonthlyCents: null,
    });
    expect(r.grossCents).toBe(52000);
    expect(r.advancesCents).toBe(10000);
    expect(r.netCents).toBe(42000);
    expect(r.daysWorked).toBe(2);
  });

  it("propriedade: líquido = bruto − adelantos − ajustes e bruto = Σ linhas", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            day: fc.integer({ min: 1, max: 7 }),
            pieces: fc.integer({ min: 0, max: 2000 }),
            rate: fc.integer({ min: 1, max: 1000 }),
          }),
          { maxLength: 40 },
        ),
        fc.array(fc.integer({ min: 0, max: 100000 }), { maxLength: 10 }),
        fc.integer({ min: 0, max: 50000 }),
        (rows, advances, adj) => {
          const r = computeSettlement({
            production: rows.map((x) => ({ workDate: "2026-11-0" + x.day, pieces: x.pieces, pieceRateCents: x.rate })),
            advancesCents: advances,
            adjustmentsCents: adj,
            isEmployee: true,
            minimumWageMonthlyCents: 150000,
          });
          const gross = rows.reduce((a, x) => a + x.pieces * x.rate, 0);
          expect(r.grossCents).toBe(gross);
          expect(r.netCents).toBe(gross - advances.reduce((a, b) => a + b, 0) - adj);
          expect(Number.isInteger(r.netCents)).toBe(true);
          expect(r.daysWorked).toBeLessThanOrEqual(7);
        },
      ),
    );
  });
});

describe("alerta CLT art. 78 (educativo)", () => {
  const minWage = 150000; // valor FICTÍCIO de teste — o real vem de legal_params
  it("piso diário = mensal ÷ 30", () => {
    expect(dailyFloor(minWage)).toBe(5000);
  });
  it("sinaliza empregado abaixo do piso", () => {
    const r = computeSettlement({
      production: [{ workDate: "2026-11-09", pieces: 100, pieceRateCents: 40 }],
      advancesCents: [],
      isEmployee: true,
      minimumWageMonthlyCents: minWage,
    });
    expect(r.perDayCents).toBe(4000);
    expect(r.belowMinWage).toBe(true);
  });
  it("não sinaliza quem não é empregado", () => {
    const r = computeSettlement({
      production: [{ workDate: "2026-11-09", pieces: 100, pieceRateCents: 40 }],
      advancesCents: [],
      isEmployee: false,
      minimumWageMonthlyCents: minWage,
    });
    expect(r.belowMinWage).toBe(false);
  });
  it("sem parâmetro vigente, não alerta", () => {
    const r = computeSettlement({
      production: [{ workDate: "2026-11-09", pieces: 1, pieceRateCents: 1 }],
      advancesCents: [],
      isEmployee: true,
      minimumWageMonthlyCents: null,
    });
    expect(r.belowMinWage).toBe(false);
  });
  it("alerta de jornada acima do limite", () => {
    const r = computeSettlement({
      production: [
        { workDate: "2026-11-09", pieces: 10, pieceRateCents: 40, hours: 7 },
        { workDate: "2026-11-09", pieces: 10, pieceRateCents: 40, hours: 5 },
      ],
      advancesCents: [],
      isEmployee: true,
      minimumWageMonthlyCents: null,
      maxHoursPerDay: 10,
    });
    expect(r.excessHours).toBe(true);
  });
});

describe("período do acerto (sábado)", () => {
  it("sexta 13/11/2026 → 08/11 a 14/11", () => {
    expect(settlementPeriod(new Date(Date.UTC(2026, 10, 13)))).toEqual({ start: "2026-11-08", end: "2026-11-14" });
  });
});
