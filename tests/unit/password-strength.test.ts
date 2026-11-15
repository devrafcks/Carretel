import { describe, expect, it } from "vitest";
import { checkPassword, judgePassword, personalInputs, PASSWORD_MIN_SCORE } from "@/lib/password-strength";

describe("judgePassword (regra pura)", () => {
  it("tamanho mínimo e máximo vêm antes da pontuação", () => {
    expect(judgePassword("abc", 4, null)).toEqual({ score: 0, ok: false, hint: "tooShort" });
    expect(judgePassword("a".repeat(129), 4, null)).toMatchObject({ ok: false, hint: "tooLong" });
  });

  it(`bloqueia pontuação abaixo de ${PASSWORD_MIN_SCORE} e explica o motivo`, () => {
    expect(judgePassword("12345678", 0, "topTen")).toEqual({ score: 0, ok: false, hint: "common" });
    expect(judgePassword("qwertyui", 1, "straightRow")).toMatchObject({ ok: false, hint: "pattern" });
    expect(judgePassword("abcdefgh", 1, null)).toMatchObject({ ok: false, hint: "longer" });
    expect(judgePassword("razoavel1", 2, null)).toMatchObject({ ok: true });
    expect(judgePassword("muito-boa-senha", 4, "common")).toEqual({ score: 4, ok: true, hint: null });
  });

  it("aceita pontuação fora da faixa sem quebrar", () => {
    expect(judgePassword("abcdefghij", 9, null).score).toBe(4);
    expect(judgePassword("abcdefghij", -1, null).score).toBe(0);
  });
});

describe("personalInputs", () => {
  it("inclui e-mail, partes do e-mail, nome e palavras do app", () => {
    const words = personalInputs("Maria.Quispe@exemplo.com", "Maria Quispe");
    expect(words).toEqual(expect.arrayContaining(["maria.quispe@exemplo.com", "maria.quispe", "maria", "quispe", "carretel", "costura"]));
  });
});

describe("checkPassword (zxcvbn-ts de verdade)", () => {
  it.each(["12345678", "password", "senha123", "contraseña", "qwertyuiop", "carretel2026", "aaaaaaaaaa"])("recusa %s", async (pw) => {
    const r = await checkPassword(pw, { locales: ["pt-BR", "es"] });
    expect(r.ok).toBe(false);
    expect(r.hint).not.toBeNull();
  });

  it("recusa senha feita do próprio e-mail", async () => {
    const r = await checkPassword("mariaquispe1", { locales: ["es"], email: "mariaquispe@exemplo.com" });
    expect(r.ok).toBe(false);
  });

  it.each(["girassol-trem-azul-9", "Lapiz verde y mango 47", "tesoura amarela no ônibus"])("aceita %s", async (pw) => {
    const r = await checkPassword(pw, { locales: ["pt-BR", "es"], email: "carretel.teste@exemplo.com" });
    expect(r.ok).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(PASSWORD_MIN_SCORE);
  });
});
