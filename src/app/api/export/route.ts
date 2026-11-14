/** Exportação LGPD (art. 18 — conferir via leis-mcp): ZIP com CSV por tabela + JSON completo. */
import JSZip from "jszip";
import {
  advances,
  batchOperations,
  batches,
  clients,
  deliveryProofs,
  payments,
  productionLogs,
  receivables,
  settlementItems,
  settlements,
  workers,
  notifications,
} from "@/db/schema";
import { workshopFromRequest } from "@/lib/session";
import { hitRateLimit } from "@/db/public";
import { audit } from "@/lib/audit";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0]!);
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = v instanceof Date ? v.toISOString() : typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

export async function GET() {
  const ctx = await workshopFromRequest();
  if (!ctx) return new Response(null, { status: 401 });
  // exportação completa é do dono do taller, e pesada: no máximo 5 por hora
  if (ctx.role !== "owner") return new Response(null, { status: 403 });
  if (await hitRateLimit(`export:${ctx.workshop.id}`, 5, 3600)) return new Response(null, { status: 429 });
  const t = ctx.tdb;
  const strip = <T extends Record<string, unknown>>(rows: T[], drop: string[]) =>
    rows.map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => !drop.includes(k))));
  const data = {
    workshop: strip([ctx.workshop as unknown as Record<string, unknown>], ["docNumberEnc"]),
    clients: await t.select(clients),
    workers: strip(await t.select(workers), ["docNumberEnc"]),
    batches: await t.select(batches),
    notifications: await t.select(notifications),
    batch_operations: await t.select(batchOperations),
    production_logs: await t.select(productionLogs),
    advances: await t.select(advances),
    settlements: await t.select(settlements),
    settlement_items: await t.select(settlementItems),
    delivery_proofs: await t.select(deliveryProofs),
    receivables: await t.select(receivables),
    payments: await t.select(payments),
  };
  const zip = new JSZip();
  zip.file("dados.json", JSON.stringify({ exportedAt: new Date().toISOString(), ...data }, null, 2));
  for (const [name, rows] of Object.entries(data)) zip.file(`csv/${name}.csv`, toCsv(rows as Record<string, unknown>[]));
  zip.file(
    "LEIA-ME.txt",
    "Exportação dos seus dados. Os documentos (CPF/RNM) não são exportados em claro por segurança; só os 3 últimos dígitos.\n",
  );
  const buf = await zip.generateAsync({ type: "uint8array" });
  await audit("data.export", { workshopId: ctx.workshop.id, userId: ctx.user.id });
  const date = new Date().toISOString().slice(0, 10);
  return new Response(buf as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="carretel-dados-${date}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
