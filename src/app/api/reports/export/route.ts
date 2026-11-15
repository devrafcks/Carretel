/** Exportação dos relatórios em CSV (plano completo). Abre no Excel/Planilhas. */
import { workshopFromRequest } from "@/lib/session";
import { isPremium } from "@/lib/subscription";
import { hitRateLimit } from "@/db/public";
import { clientRanking, monthlyRevenue, workerProductivity } from "@/server/reports";

const cents = (v: number) => (v / 100).toFixed(2).replace(".", ",");
const cell = (v: string | number) => {
  const s = String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET() {
  const ctx = await workshopFromRequest();
  if (!ctx) return new Response(null, { status: 401 });
  if (!isPremium(ctx.workshop.planStatus, ctx.access)) return new Response(null, { status: 402 });
  if (await hitRateLimit(`reports-export:${ctx.workshop.id}`, 20, 3600)) return new Response(null, { status: 429 });

  const [revenue, clients, team] = await Promise.all([monthlyRevenue(ctx.tdb, 12), clientRanking(ctx.tdb), workerProductivity(ctx.tdb, 30)]);
  const lines: (string | number)[][] = [
    ["Faturado x recebido (R$)"],
    ["Mês", "Faturado", "Recebido"],
    ...revenue.map((r) => [r.month, cents(r.issuedCents), cents(r.paidCents)]),
    [],
    ["Clientes"],
    ["Cliente", "Cortes", "Volume (R$)", "Deve agora (R$)", "Dias médios para pagar"],
    ...clients.map((c) => [c.name, c.batches, cents(c.volumeCents), cents(c.owedCents), c.avgDaysToPay ?? ""]),
    [],
    ["Produção da equipe (últimos 30 dias)"],
    ["Pessoa", "Peças", "Dias trabalhados", "Peças por dia", "Valor (R$)"],
    ...team.map((w) => [w.name, w.pieces, w.days, w.perDay, cents(w.cents)]),
  ];
  // ";" e BOM: o Excel em português abre certo
  const csv = "﻿" + lines.map((l) => l.map(cell).join(";")).join("\r\n");
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="carretel-relatorio-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
