import { describe, expect, it } from "vitest";
import { parseSpokenDate, parseSpokenInteger, parseSpokenMoney } from "@/lib/speech/numbers";

describe("quantidade falada", () => {
  it.each([
    ["trescientas", 300],
    ["trescientas piezas", 300],
    ["mil doscientos", 1200],
    ["trezentas", 300],
    ["trezentas e cinquenta", 350],
    ["dos mil quinientas", 2500],
    ["300", 300],
    ["1.200", 1200],
    ["veinticinco", 25],
    ["duzentas peças", 200],
  ])("%s → %d", (input, expected) => {
    expect(parseSpokenInteger(input)).toBe(expected);
  });

  it("devolve null para texto sem número", () => {
    expect(parseSpokenInteger("hola buenas")).toBeNull();
  });
});

describe("dinheiro falado", () => {
  it.each([
    ["dos cincuenta", 250],
    ["dois e cinquenta", 250],
    ["tres reales", 300],
    ["dois reais e cinquenta centavos", 250],
    ["2,50", 250],
    ["2.50", 250],
    ["R$ 3", 300],
    ["un real con veinte", 120],
    ["cinco", 500],
  ])("%s → %d centavos", (input, expected) => {
    expect(parseSpokenMoney(input)).toBe(expected);
  });
});

describe("prazo falado", () => {
  const friday = new Date(Date.UTC(2026, 10, 13)); // sexta 13/11/2026
  it("en 7 días", () => expect(parseSpokenDate("en 7 días", friday)).toBe("2026-11-20"));
  it("em sete dias", () => expect(parseSpokenDate("em sete dias", friday)).toBe("2026-11-20"));
  it("viernes (próxima)", () => expect(parseSpokenDate("para el viernes", friday)).toBe("2026-11-20"));
  it("sábado", () => expect(parseSpokenDate("sábado", friday)).toBe("2026-11-14"));
  it("mañana", () => expect(parseSpokenDate("mañana", friday)).toBe("2026-11-14"));
  it("20/11", () => expect(parseSpokenDate("20/11", friday)).toBe("2026-11-20"));
});
