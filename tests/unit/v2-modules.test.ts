import { describe, expect, it } from "vitest";
import { isOverdue, maxReturnable, shipmentStatus, summarizeShipment } from "@/lib/outsource";
import { pickWorkerRate, settlementPeriodFor } from "@/lib/settlement";
import { chargePeriodRange } from "@/lib/dates";
import { reminderMessage } from "@/lib/wa-templates";

describe("facção: envio e retorno", () => {
  it("a diferença aparece na hora: enviado − bom", () => {
    const s = summarizeShipment(100, [{ goodQty: 80, defectQty: 5, missingQty: 0 }]);
    expect(s).toEqual({ sent: 100, good: 80, defect: 5, missing: 0, pending: 15, difference: 20 });
  });

  it("status: enviado → devolvido parcial → devolvido", () => {
    expect(shipmentStatus("sent", 100, [])).toBe("sent");
    expect(shipmentStatus("in_production", 100, [])).toBe("in_production");
    expect(shipmentStatus("in_production", 100, [{ goodQty: 40, defectQty: 0, missingQty: 0 }])).toBe("partial");
    expect(
      shipmentStatus("partial", 100, [
        { goodQty: 40, defectQty: 0, missingQty: 0 },
        { goodQty: 55, defectQty: 3, missingQty: 2 },
      ]),
    ).toBe("returned");
  });

  it("apagar todos os retornos volta para enviado", () => {
    expect(shipmentStatus("returned", 100, [])).toBe("sent");
  });

  it("não deixa devolver mais do que foi enviado", () => {
    expect(maxReturnable(100, [{ goodQty: 90, defectQty: 4, missingQty: 0 }])).toBe(6);
    expect(maxReturnable(10, [{ goodQty: 10, defectQty: 0, missingQty: 0 }])).toBe(0);
  });

  it("atrasado só com peças pendentes e prazo vencido", () => {
    expect(isOverdue("2026-11-10", 5, "2026-11-15")).toBe(true);
    expect(isOverdue("2026-11-10", 0, "2026-11-15")).toBe(false);
    expect(isOverdue("2026-11-20", 5, "2026-11-15")).toBe(false);
    expect(isOverdue(null, 5, "2026-11-15")).toBe(false);
  });
});

describe("folha por peça: valor de cada costureira", () => {
  const rates = [
    { machine: null, reference: null, pieceRateCents: 30 },
    { machine: "overlock", reference: null, pieceRateCents: 40 },
    { machine: null, reference: "Blusa 12", pieceRateCents: 55 },
    { machine: "overlock", reference: "Blusa 12", pieceRateCents: 60 },
  ];

  it("o mais específico ganha: modelo + máquina > modelo > máquina > geral", () => {
    expect(pickWorkerRate(rates, { machine: "overlock", reference: "blusa 12" })).toBe(60);
    expect(pickWorkerRate(rates, { machine: "recta", reference: "Blusa 12" })).toBe(55);
    expect(pickWorkerRate(rates, { machine: "overlock", reference: "Saia" })).toBe(40);
    expect(pickWorkerRate(rates, { machine: "recta", reference: null })).toBe(30);
  });

  it("sem valor próprio vale o da operação (null)", () => {
    expect(pickWorkerRate([], { machine: "recta", reference: null })).toBeNull();
    expect(pickWorkerRate([{ machine: "overlock", reference: null, pieceRateCents: 40 }], { machine: "recta", reference: null })).toBeNull();
  });

  it("quinzenal fecha 14 dias terminando no sábado", () => {
    const thu = new Date(Date.UTC(2026, 10, 12));
    expect(settlementPeriodFor(thu, "weekly")).toEqual({ start: "2026-11-08", end: "2026-11-14" });
    expect(settlementPeriodFor(thu, "biweekly")).toEqual({ start: "2026-11-01", end: "2026-11-14" });
  });
});

describe("cobrança por período", () => {
  it("semana, quinzena, mês e tudo em aberto", () => {
    expect(chargePeriodRange("week", "2026-11-15")).toEqual({ from: "2026-11-09", to: "2026-11-15" });
    expect(chargePeriodRange("fortnight", "2026-11-15")).toEqual({ from: "2026-11-02", to: "2026-11-15" });
    expect(chargePeriodRange("month", "2026-11-15")).toEqual({ from: "2026-11-01", to: "2026-11-15" });
    expect(chargePeriodRange("all", "2026-11-15")).toEqual({ from: null, to: "2026-11-15" });
  });
});

describe("lembrete de cobrança por WhatsApp", () => {
  const base = {
    client: "Dona Rosa",
    workshop: "Taller Sol",
    items: [
      { deliveredOn: "03/11", quantity: 120, reference: "B12", amountCents: 60000, url: "https://x/c/a" },
      { deliveredOn: "10/11", quantity: 80, reference: null, amountCents: 40000, url: "https://x/c/b" },
    ],
    totalCents: 100000,
    oldestDays: 12,
    pix: "000201PIX",
  };

  it("gentil e firme em pt-BR trazem entregas, total, links e Pix", () => {
    const g = reminderMessage("pt-BR", "gentle", base);
    const f = reminderMessage("pt-BR", "firm", base);
    for (const m of [g, f]) {
      expect(m).toContain("Dona Rosa");
      expect(m).toContain("120 peças");
      expect(m).toContain("https://x/c/a");
      expect(m).toContain("https://x/c/b");
      expect(m).toMatch(/R\$\s1\.000,00/);
      expect(m).toContain("Pix copia e cola:\n000201PIX");
    }
    expect(g).toContain("Obrigado");
    expect(f).toContain("há 12 dias");
    expect(f).toContain("Peço que o pagamento seja feito hoje");
  });

  it("espanhol com usted", () => {
    const f = reminderMessage("es", "firm", base);
    expect(f).toContain("Le pido que haga el pago hoy");
    expect(f).toContain("Pix copia y pega");
    expect(reminderMessage("es", "gentle", { ...base, items: [base.items[0]!], pix: null })).toContain("de la entrega pendiente de pago");
  });
});

describe("upload: detecção de EXIF no JPEG", () => {
  const seg = (marker: number, payload: Buffer) => Buffer.concat([Buffer.from([0xff, marker, (payload.length + 2) >> 8, (payload.length + 2) & 0xff]), payload]);
  const soi = Buffer.from([0xff, 0xd8]);
  const sos = Buffer.from([0xff, 0xda, 0x00, 0x02]);

  it("acusa APP1 Exif de verdade", async () => {
    const { jpegHasExif } = await import("@/lib/image-check");
    expect(jpegHasExif(Buffer.concat([soi, seg(0xe1, Buffer.from("Exif\0\0MM", "binary")), sos]))).toBe(true);
  });

  it("não confunde XMP (também APP1) nem bytes FF E1 dentro de tabelas ou da imagem", async () => {
    const { jpegHasExif } = await import("@/lib/image-check");
    const xmp = seg(0xe1, Buffer.from("http://ns.adobe.com/xap/1.0/\0<x/>", "binary"));
    const dqt = seg(0xdb, Buffer.from([0x00, 0xff, 0xe1, 0x10]));
    const scan = Buffer.from([0x12, 0xff, 0xe1, 0x34, 0xff, 0xd9]);
    expect(jpegHasExif(Buffer.concat([soi, seg(0xe0, Buffer.from("JFIF\0", "binary")), xmp, dqt, sos, scan]))).toBe(false);
  });
});

describe("compressão: degraus de qualidade", () => {
  it("desce de 0,08 em 0,08 até o piso de 0,66", async () => {
    const { nextQualities } = await import("@/lib/offline/image-steps");
    expect(nextQualities(0.82)).toEqual([0.74, 0.66]);
    expect(nextQualities(0.78)).toEqual([0.7]);
    expect(nextQualities(0.66)).toEqual([]);
  });

  it("para no primeiro que cabe no alvo e nunca troca por um arquivo maior", async () => {
    const { pickEncoding } = await import("@/lib/offline/image-steps");
    const blob = (n: number) => new Blob([new Uint8Array(n)]);
    const asked: number[] = [];
    const sizes: Record<number, number> = { 0.74: 190_000, 0.66: 150_000 };
    const out = await pickEncoding(blob(260_000), 0.82, 200_000, async (q) => (asked.push(q), blob(sizes[q]!)));
    expect(out.size).toBe(190_000);
    expect(asked).toEqual([0.74]);
    // já cabe: não recomprime
    const calls: number[] = [];
    expect((await pickEncoding(blob(120_000), 0.82, 200_000, async (q) => (calls.push(q), blob(1)))).size).toBe(120_000);
    expect(calls).toEqual([]);
    // nenhum cabe: fica com o menor
    expect((await pickEncoding(blob(500_000), 0.82, 200_000, async (q) => blob(q === 0.74 ? 420_000 : 380_000))).size).toBe(380_000);
  });
});
