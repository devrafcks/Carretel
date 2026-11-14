import { describe, expect, it } from "vitest";
import { formatBRL, parseMoneyInput } from "@/lib/money";
import { canonicalJson, decryptField, encryptField, publicToken, sha256Hex } from "@/lib/crypto";
import { isValidCpf, isValidRnm, toE164 } from "@/lib/validators";

describe("money", () => {
  it.each([
    ["2,50", 250],
    ["R$ 1.234,56", 123456],
    ["1234", 123400],
    ["3.5", 350],
    ["900,00", 90000],
    ["1.200", 120000],
  ])("%s → %d", (s, c) => expect(parseMoneyInput(s)).toBe(c));
  it("formata em BRL", () => {
    expect(formatBRL(90000, "pt-BR")).toBe("R$ 900,00");
    expect(formatBRL(90000, "es")).toContain("900");
    expect(formatBRL(90000, "es")).toContain("R$");
  });
});

describe("crypto", () => {
  it("AES-256-GCM ida e volta", () => {
    const enc = encryptField("123.456.789-09");
    expect(enc).not.toContain("123");
    expect(decryptField(enc)).toBe("123.456.789-09");
  });
  it("token de 128 bits", () => {
    expect(publicToken()).toMatch(/^[A-Za-z0-9_-]{22}$/);
  });
  it("JSON canônico independe da ordem das chaves", () => {
    expect(sha256Hex(canonicalJson({ b: 1, a: { d: 2, c: 3 } }))).toBe(sha256Hex(canonicalJson({ a: { c: 3, d: 2 }, b: 1 })));
  });
});

describe("validators", () => {
  it("CPF", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("111.111.111-11")).toBe(false);
  });
  it("RNM formato", () => expect(isValidRnm("V123456-7")).toBe(true));
  it("telefone", () => expect(toE164("(11) 98888-7777")).toBe("+5511988887777"));
});
