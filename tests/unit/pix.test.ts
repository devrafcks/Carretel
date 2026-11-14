import { describe, expect, it } from "vitest";
import { buildPixBrCode, crc16ccitt, isValidBrCode, normalizePixKey } from "@/lib/pix-brcode";

describe("CRC16-CCITT (0x1021, init 0xFFFF)", () => {
  it("vetor padrão 123456789 = 29B1", () => {
    expect(crc16ccitt("123456789")).toBe("29B1");
  });
});

describe("Pix BR Code", () => {
  it("reproduz o exemplo do manual do BR Code (BCB)", () => {
    const code = buildPixBrCode({
      key: "123e4567-e12b-12d1-a456-426655440000",
      merchantName: "Fulano de Tal",
      merchantCity: "BRASILIA",
    });
    expect(code).toBe(
      "00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D",
    );
  });

  it("inclui valor, txid e CRC válido", () => {
    const code = buildPixBrCode({
      key: "+5511999990000",
      merchantName: "Taller Rosa",
      merchantCity: "São Paulo",
      amountCents: 90000,
      txid: "LOTE1234",
    });
    expect(code).toContain("5406900.00");
    expect(code).toContain("6009SAO PAULO");
    expect(code).toContain("0508LOTE1234");
    expect(isValidBrCode(code)).toBe(true);
  });

  it("detecta CRC adulterado", () => {
    const code = buildPixBrCode({ key: "chave@exemplo.com", merchantName: "X", merchantCity: "SP", amountCents: 100 });
    const tampered = code.slice(0, -1) + (code.endsWith("0") ? "1" : "0");
    expect(isValidBrCode(tampered)).toBe(false);
  });

  it("normaliza chaves", () => {
    expect(normalizePixKey("(11) 99999-0000", "phone")).toBe("+5511999990000");
    expect(normalizePixKey("123.456.789-09", "cpf")).toBe("12345678909");
  });
});
