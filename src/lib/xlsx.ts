/**
 * Planilhas Excel com a cara do Carretel: faixa de título escura, subtítulo menta, cabeçalho verde,
 * linhas zebradas, moeda em R$, datas brasileiras, total no rodapé, filtro e cabeçalho congelado.
 */
import "server-only";
import ExcelJS from "exceljs";

const C = {
  ink: "FF121815",
  green: "FF1F855D",
  greenDark: "FF0B6545",
  mint50: "FFEAFAF0",
  mint100: "FFD2F5E1",
  border: "FFD9E0DD",
  muted: "FF515B57",
  white: "FFFFFFFF",
  good: "FF0B6545",
  warn: "FF8A5A00",
  bad: "FF9B1C1C",
} as const;

export type ColKind = "text" | "money" | "int" | "date" | "pct" | "status" | "decimal";
export type Col = { key: string; header: string; width?: number; kind?: ColKind; total?: boolean };
export type Tone = "good" | "warn" | "bad" | "neutral";
export type SheetSpec = {
  name: string;
  title: string;
  subtitle: string;
  columns: Col[];
  rows: Record<string, unknown>[];
  totalLabel?: string;
  tone?: (row: Record<string, unknown>) => Tone;
  empty?: string;
};

const fill = (argb: string): ExcelJS.Fill => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
const thin = { style: "thin" as const, color: { argb: C.border } };
const FONT = "Calibri";

/** Datas ISO (yyyy-mm-dd) viram Date ao meio-dia UTC, para o Excel não "voltar um dia". */
export function isoDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  return new Date(v.slice(0, 10) + "T12:00:00Z");
}

export function newWorkbook() {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Carretel";
  wb.created = new Date();
  return wb;
}

export function addSheet(wb: ExcelJS.Workbook, spec: SheetSpec) {
  const ws = wb.addWorksheet(spec.name.slice(0, 31), {
    views: [{ state: "frozen", ySplit: 4, showGridLines: false }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9, margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } },
    headerFooter: { oddFooter: "&L&8Carretel&R&8&P / &N" },
  });
  const n = spec.columns.length;
  ws.columns = spec.columns.map((c) => ({ key: c.key, width: c.width ?? (c.kind === "money" ? 16 : c.kind === "date" ? 13 : c.kind === "int" ? 11 : 22) }));

  // 1 — faixa de título
  ws.mergeCells(1, 1, 1, n);
  const t = ws.getCell(1, 1);
  t.value = `carretel  ·  ${spec.title}`;
  t.font = { name: FONT, size: 16, bold: true, color: { argb: C.white } };
  t.fill = fill(C.ink);
  t.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(1).height = 34;

  // 2 — subtítulo
  ws.mergeCells(2, 1, 2, n);
  const st = ws.getCell(2, 1);
  st.value = spec.subtitle;
  st.font = { name: FONT, size: 10, color: { argb: C.muted } };
  st.fill = fill(C.mint100);
  st.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(2).height = 22;
  ws.getRow(3).height = 8;

  // 4 — cabeçalho
  const head = ws.getRow(4);
  spec.columns.forEach((c, i) => {
    const cell = head.getCell(i + 1);
    cell.value = c.header;
    cell.font = { name: FONT, size: 10, bold: true, color: { argb: C.white } };
    cell.fill = fill(C.green);
    cell.alignment = { vertical: "middle", horizontal: c.kind && c.kind !== "text" && c.kind !== "status" ? "right" : "left", indent: 1, wrapText: true };
    cell.border = { bottom: { style: "medium", color: { argb: C.greenDark } } };
  });
  head.height = 26;

  // dados
  const first = 5;
  if (spec.rows.length === 0) {
    ws.mergeCells(first, 1, first, n);
    const e = ws.getCell(first, 1);
    e.value = spec.empty ?? "—";
    e.font = { name: FONT, size: 10, italic: true, color: { argb: C.muted } };
    e.alignment = { indent: 1 };
    return ws;
  }
  spec.rows.forEach((r, idx) => {
    const row = ws.getRow(first + idx);
    const zebra = idx % 2 === 1;
    const tone = spec.tone?.(r) ?? "neutral";
    spec.columns.forEach((c, i) => {
      const cell = row.getCell(i + 1);
      const v = r[c.key];
      cell.value = c.kind === "money" ? (typeof v === "number" ? v / 100 : null) : c.kind === "date" ? isoDate(v as string | Date | null) : c.kind === "pct" ? (typeof v === "number" ? v / 100 : null) : ((v ?? null) as ExcelJS.CellValue);
      cell.font = { name: FONT, size: 10, color: { argb: C.ink } };
      if (zebra) cell.fill = fill(C.mint50);
      cell.border = { bottom: thin };
      cell.alignment = { vertical: "middle", indent: 1, horizontal: c.kind && c.kind !== "text" && c.kind !== "status" ? "right" : "left" };
      if (c.kind === "money") cell.numFmt = '"R$" #,##0.00;[Red]-"R$" #,##0.00';
      if (c.kind === "int") cell.numFmt = "#,##0";
      if (c.kind === "decimal") cell.numFmt = "#,##0.0";
      if (c.kind === "pct") cell.numFmt = "0%";
      if (c.kind === "date") cell.numFmt = "dd/mm/yyyy";
      if (c.kind === "status") {
        const color = tone === "good" ? C.good : tone === "warn" ? C.warn : tone === "bad" ? C.bad : C.muted;
        cell.font = { name: FONT, size: 10, bold: true, color: { argb: color } };
      }
    });
    row.height = 20;
  });

  // totais
  const last = first + spec.rows.length - 1;
  if (spec.columns.some((c) => c.total)) {
    const tr = ws.getRow(last + 1);
    spec.columns.forEach((c, i) => {
      const cell = tr.getCell(i + 1);
      const col = ws.getColumn(i + 1).letter;
      if (i === 0) cell.value = spec.totalLabel ?? "Total";
      else if (c.total) {
        // resultado já calculado junto: aparece também em prévias (WhatsApp, Google Planilhas)
        const sum = spec.rows.reduce((a, r) => a + (typeof r[c.key] === "number" ? (r[c.key] as number) : 0), 0);
        cell.value = { formula: `SUBTOTAL(9,${col}${first}:${col}${last})`, result: c.kind === "money" ? sum / 100 : sum };
        cell.numFmt = c.kind === "money" ? '"R$" #,##0.00' : "#,##0";
      }
      cell.font = { name: FONT, size: 10, bold: true, color: { argb: C.ink } };
      cell.fill = fill(C.mint100);
      cell.border = { top: { style: "medium", color: { argb: C.green } } };
      cell.alignment = { vertical: "middle", indent: 1, horizontal: i === 0 ? "left" : "right" };
    });
    tr.height = 22;
  }
  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: last, column: n } };
  return ws;
}

/** Folha de resumo: cartões de números (rótulo pequeno, valor grande). */
export function addSummary(wb: ExcelJS.Workbook, spec: { name: string; title: string; subtitle: string; items: { label: string; value: number | string; kind?: "money" | "int" | "text" }[] }) {
  const ws = wb.addWorksheet(spec.name.slice(0, 31), { views: [{ showGridLines: false }] });
  ws.columns = [{ width: 3 }, { width: 34 }, { width: 24 }, { width: 3 }];
  ws.mergeCells(1, 1, 1, 4);
  const t = ws.getCell(1, 1);
  t.value = `carretel  ·  ${spec.title}`;
  t.font = { name: FONT, size: 18, bold: true, color: { argb: C.white } };
  t.fill = fill(C.ink);
  t.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(1).height = 40;
  ws.mergeCells(2, 1, 2, 4);
  const st = ws.getCell(2, 1);
  st.value = spec.subtitle;
  st.font = { name: FONT, size: 10, color: { argb: C.muted } };
  st.fill = fill(C.mint100);
  st.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(2).height = 22;
  spec.items.forEach((it, i) => {
    const r = 4 + i * 2;
    const l = ws.getCell(r, 2);
    l.value = it.label;
    l.font = { name: FONT, size: 10, color: { argb: C.muted } };
    l.alignment = { vertical: "middle", indent: 1 };
    const v = ws.getCell(r, 3);
    v.value = it.kind === "money" && typeof it.value === "number" ? it.value / 100 : it.value;
    v.font = { name: FONT, size: 14, bold: true, color: { argb: C.ink } };
    v.alignment = { vertical: "middle", horizontal: "right", indent: 1 };
    if (it.kind === "money") v.numFmt = '"R$" #,##0.00';
    if (it.kind === "int") v.numFmt = "#,##0";
    for (const c of [2, 3]) {
      const cell = ws.getCell(r, c);
      cell.fill = fill(i % 2 ? C.white : C.mint50);
      cell.border = { left: c === 2 ? { style: "medium", color: { argb: C.green } } : undefined, bottom: thin };
    }
    ws.getRow(r).height = 26;
    ws.getRow(r + 1).height = 4;
  });
  return ws;
}

export async function workbookResponse(wb: ExcelJS.Workbook, filename: string) {
  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf as ArrayBuffer, {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
