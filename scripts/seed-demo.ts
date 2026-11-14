/**
 * pnpm db:seed-demo <email>
 * Preenche o taller da conta <email> com ~6 semanas de dados FICTÍCIOS (clientes, equipe, cortes,
 * produção, vales, acertos, comprovantes, cobranças e pagamentos), com datas no passado.
 * Não mexe no plano/assinatura nem no contador de cortes grátis. Recusa rodar se o taller já tem muitos cortes.
 */
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { tenantDb } from "@/db/tenant";
import { findWorkshopForUser } from "@/db/public";
import {
  advances,
  batchOperations,
  batches,
  clients,
  deliveryProofs,
  payments,
  productionLogs,
  receivables,
  settlements,
  workers,
  workshopSettings,
  type Machine,
  type ProofSnapshot,
  type SizeGrid,
} from "@/db/schema";
import { closeSettlementCore } from "@/server/core";
import { canonicalJson, publicToken, sha256Hex } from "@/lib/crypto";

const TODAY = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
TODAY.setHours(12, 0, 0, 0);
const daysAgo = (n: number) => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - n);
  return d;
};
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const at = (n: number, hour = 10) => {
  const d = daysAgo(n);
  d.setHours(hour, 15, 0, 0);
  return d;
};

/* aleatório determinístico */
let seed = 42;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)]!;

type Plan = {
  ago: number; // dias desde que o corte chegou
  client: string;
  ref: string;
  qty: number;
  price: number; // centavos por peça
  color: string;
  grid: SizeGrid;
  ops: [Machine, number][]; // máquina, centavos por peça para a costureira
  done: number; // fração produzida (1 = pronto)
  deliveredAgo?: number;
  confirmed?: boolean;
  viewed?: boolean;
  paid?: "full" | "partial";
  paidAgo?: number;
  dueIn?: number; // prazo em dias a partir de hoje (para cortes ainda abertos)
};

const CLIENTS = ["Confecções Lua", "Bruma Modas", "Ateliê Sol Nascente", "Moda Brás Center", "Estilo Bom Retiro", "Lima Jeans"];
const WORKERS = ["Juan Mamani", "Rosa Quispe", "Wilfredo Choque", "Ana Condori", "Luis Huanca", "Marta Flores"];

const PLANS: Plan[] = [
  { ago: 42, client: "Confecções Lua", ref: "LU-201", qty: 400, price: 350, color: "Preto", grid: { P: 100, M: 150, G: 150 }, ops: [["recta", 90], ["overlock", 60]], done: 1, deliveredAgo: 33, confirmed: true, paid: "full", paidAgo: 27 },
  { ago: 38, client: "Bruma Modas", ref: "BR-88", qty: 250, price: 420, color: "Off-white", grid: { P: 50, M: 100, G: 100 }, ops: [["recta", 110], ["collareta", 70]], done: 1, deliveredAgo: 29, confirmed: true, paid: "full", paidAgo: 22 },
  { ago: 35, client: "Ateliê Sol Nascente", ref: "SN-15", qty: 300, price: 300, color: "Azul-marinho", grid: { M: 120, G: 120, GG: 60 }, ops: [["recta", 80], ["overlock", 55]], done: 1, deliveredAgo: 31, confirmed: true },
  { ago: 30, client: "Moda Brás Center", ref: "MB-310", qty: 500, price: 280, color: "Mescla", grid: { P: 100, M: 200, G: 200 }, ops: [["overlock", 70], ["collareta", 60]], done: 1, deliveredAgo: 21, confirmed: true, paid: "partial", paidAgo: 12 },
  { ago: 26, client: "Confecções Lua", ref: "LU-207", qty: 350, price: 380, color: "Vinho", grid: { P: 70, M: 140, G: 140 }, ops: [["recta", 95], ["overlock", 60]], done: 1, deliveredAgo: 17, confirmed: true, paid: "full", paidAgo: 10 },
  { ago: 22, client: "Estilo Bom Retiro", ref: "BR-12", qty: 200, price: 450, color: "Verde-oliva", grid: { M: 80, G: 80, GG: 40 }, ops: [["recta", 120], ["interlock", 65]], done: 1, deliveredAgo: 18, confirmed: true },
  { ago: 17, client: "Lima Jeans", ref: "LJ-44", qty: 600, price: 250, color: "Jeans claro", grid: { "38": 150, "40": 200, "42": 150, "44": 100 }, ops: [["recta", 70], ["overlock", 45]], done: 1, deliveredAgo: 9, viewed: true },
  { ago: 13, client: "Bruma Modas", ref: "BR-91", qty: 300, price: 400, color: "Areia", grid: { P: 60, M: 120, G: 120 }, ops: [["recta", 105], ["collareta", 65]], done: 1, deliveredAgo: 5, confirmed: true },
  { ago: 10, client: "Confecções Lua", ref: "LU-215", qty: 450, price: 360, color: "Preto", grid: { P: 90, M: 180, G: 180 }, ops: [["recta", 90], ["overlock", 60]], done: 1, dueIn: 2 },
  { ago: 7, client: "Ateliê Sol Nascente", ref: "SN-19", qty: 380, price: 320, color: "Branco", grid: { M: 150, G: 150, GG: 80 }, ops: [["recta", 85], ["overlock", 55]], done: 0.6, dueIn: 4 },
  { ago: 5, client: "Moda Brás Center", ref: "MB-322", qty: 520, price: 290, color: "Cinza", grid: { P: 120, M: 200, G: 200 }, ops: [["overlock", 70], ["collareta", 60]], done: 0.35, dueIn: 6 },
  { ago: 1, client: "Lima Jeans", ref: "LJ-47", qty: 400, price: 260, color: "Jeans escuro", grid: { "38": 100, "40": 150, "42": 150 }, ops: [["recta", 72], ["overlock", 46]], done: 0, dueIn: 12 },
];

async function main() {
  const email = (process.argv[2] ?? "").trim().toLowerCase();
  if (!email) throw new Error("uso: pnpm db:seed-demo <email>");
  const db = await getDb();
  const users = (await db.execute(sql`select id from neon_auth."user" where lower(email) = ${email}`)) as unknown as { rows: { id: string }[] };
  const userId = users.rows[0]?.id;
  if (!userId) throw new Error("conta não encontrada");
  const m = await findWorkshopForUser(userId);
  if (!m) throw new Error("a conta ainda não tem taller (faça o cadastro do taller primeiro)");
  const ws = m.workshop;
  const tdb = await tenantDb(ws.id);
  const existing = await tdb.select(batches);
  if (existing.length > 4) throw new Error(`o taller já tem ${existing.length} cortes; nada foi alterado`);
  console.log(`taller: ${ws.name}`);

  /* clientes e equipe */
  const clientIds = new Map<string, string>();
  for (const name of CLIENTS) {
    const c = await tdb.insert(clients, { name, preferredLocale: rnd() > 0.4 ? "es" : "pt-BR", notes: null });
    clientIds.set(name, c.id);
  }
  const workerRows = [];
  for (const name of WORKERS) workerRows.push(await tdb.insert(workers, { name, isEmployee: false, phoneE164: null }));
  console.log(`+ ${CLIENTS.length} clientes, ${WORKERS.length} pessoas na equipe`);

  /* cortes, operações e produção */
  const ctxBatches: { plan: Plan; batchId: string; ops: { id: string; machine: Machine; rate: number }[] }[] = [];
  for (const plan of PLANS) {
    const due = plan.deliveredAgo !== undefined ? iso(daysAgo(plan.deliveredAgo - 1)) : iso(daysAgo(-(plan.dueIn ?? 10)));
    const b = await tdb.insert(batches, {
      clientId: clientIds.get(plan.client)!,
      reference: plan.ref,
      quantity: plan.qty,
      sizeGrid: plan.grid,
      color: plan.color,
      unitPriceCents: plan.price,
      totalCents: plan.qty * plan.price,
      dueDate: due,
      suppliesBy: rnd() > 0.3 ? "client" : "workshop",
      suppliesNote: null,
      photoIds: [],
    });
    await tdb.update(batches, { createdAt: at(plan.ago, 9), updatedAt: at(plan.ago, 9) }, eq(batches.id, b.id));
    const ops = [];
    for (const [machine, rate] of plan.ops) {
      const o = await tdb.insert(batchOperations, { batchId: b.id, machine, label: null, pieceRateCents: rate });
      ops.push({ id: o.id, machine, rate });
    }
    ctxBatches.push({ plan, batchId: b.id, ops });

    // produção: do dia seguinte à chegada até a entrega (ou hoje), só em dias úteis
    const start = plan.ago - 1;
    const end = plan.deliveredAgo !== undefined ? plan.deliveredAgo + 1 : 0;
    const days: number[] = [];
    for (let d = start; d >= end; d--) if (daysAgo(d).getDay() !== 0) days.push(d);
    if (!days.length || plan.done === 0) continue;
    for (const op of ops) {
      let left = Math.round(plan.qty * plan.done);
      const perDay = Math.ceil(left / days.length);
      for (const d of days) {
        if (left <= 0) break;
        const workersToday = 1 + Math.floor(rnd() * 2);
        for (let k = 0; k < workersToday && left > 0; k++) {
          const pieces = Math.min(left, Math.max(5, Math.round((perDay / workersToday) * (0.75 + rnd() * 0.5))));
          const w = pick(workerRows);
          await tdb.insert(productionLogs, {
            batchId: b.id,
            workerId: w.id,
            operationId: op.id,
            workDate: iso(daysAgo(d)),
            pieces,
            hours: String(7 + Math.floor(rnd() * 3)),
            amountCents: pieces * op.rate,
          });
          left -= pieces;
        }
      }
    }
  }
  console.log(`+ ${PLANS.length} cortes com produção`);

  /* vales */
  for (const [ago, idx, cents, reason] of [
    [19, 0, 10000, "Passagem"],
    [16, 2, 15000, "Aluguel"],
    [11, 1, 8000, "Mercado"],
    [8, 3, 12000, null],
    [4, 0, 5000, "Remédio"],
    [2, 4, 10000, null],
    [1, 1, 6000, "Passagem"],
  ] as const) {
    await tdb.insert(advances, { workerId: workerRows[idx]!.id, amountCents: cents, givenOn: iso(daysAgo(ago)), reason });
  }
  console.log("+ 7 vales");

  /* acertos semanais (sábados) já pagos; a semana atual fica aberta */
  const ctx = { tdb, workshop: ws, user: { id: userId, email, name: null }, access: { canWrite: true, canCreateBatch: true, canMarkPaid: true } } as unknown as Parameters<typeof closeSettlementCore>[0];
  const saturdays: number[] = [];
  for (let d = 7; d <= 35; d++) if (daysAgo(d).getDay() === 6) saturdays.push(d);
  saturdays.sort((a, b) => b - a);
  let closed = 0;
  for (const satAgo of saturdays) {
    const period = { start: iso(daysAgo(satAgo + 6)), end: iso(daysAgo(satAgo)) };
    for (const w of workerRows) {
      try {
        const s = await closeSettlementCore(ctx, w.id, period);
        await tdb.update(settlements, { status: "paid", paidAt: at(satAgo, 17), createdAt: at(satAgo, 16) }, eq(settlements.id, s.id));
        closed++;
      } catch (e) {
        if ((e as Error).message !== "nothing_to_settle") throw e;
      }
    }
  }
  console.log(`+ ${closed} acertos pagos`);

  /* entregas, comprovantes, cobranças e pagamentos */
  for (const { plan, batchId } of ctxBatches) {
    if (plan.deliveredAgo === undefined) {
      const status = plan.done >= 1 ? "ready" : plan.done > 0 ? "in_production" : "received";
      await tdb.update(batches, { status }, eq(batches.id, batchId));
      continue;
    }
    const amountCents = plan.qty * plan.price;
    const deliveredAt = at(plan.deliveredAgo, 15);
    const snapshot: ProofSnapshot = {
      v: 1,
      workshop: { name: ws.name, city: ws.city },
      client: { name: plan.client },
      batch: { reference: plan.ref, color: plan.color, unitPriceCents: plan.price, dueDate: iso(daysAgo(plan.deliveredAgo - 1)) },
      delivery: { quantity: plan.qty, sizeGrid: plan.grid, discountCents: 0, amountCents, note: null, deliveredAt: deliveredAt.toISOString(), version: 1 },
      photoIds: [],
    };
    const confirmedAt = plan.confirmed ? new Date(deliveredAt.getTime() + (2 + rnd() * 20) * 3_600_000) : null;
    const proof = await tdb.insert(deliveryProofs, {
      batchId,
      version: 1,
      previousProofId: null,
      quantity: plan.qty,
      sizeGrid: plan.grid,
      discountCents: 0,
      amountCents,
      photoIds: [],
      note: null,
      snapshot,
      contentSha256: sha256Hex(canonicalJson(snapshot)),
      publicToken: publicToken(),
      createdAt: deliveredAt,
      viewedAt: plan.confirmed || plan.viewed ? new Date(deliveredAt.getTime() + 3_600_000) : null,
      confirmedAt,
      confirmedName: plan.confirmed ? plan.client.split(" ")[0] : null,
    });
    const paidCents = plan.paid === "full" ? amountCents : plan.paid === "partial" ? Math.round(amountCents * 0.5 / 100) * 100 : 0;
    const status = plan.paid === "full" ? "paid" : plan.paid === "partial" ? "partially_paid" : plan.confirmed ? "open" : "awaiting_confirmation";
    const r = await tdb.insert(receivables, {
      clientId: clientIds.get(plan.client)!,
      deliveryProofId: proof.id,
      amountCents,
      paidCents,
      issuedOn: iso(daysAgo(plan.deliveredAgo)),
      dueOn: iso(daysAgo(plan.deliveredAgo - 7)),
      status,
      lastChargedAt: !plan.paid && plan.deliveredAgo > 14 ? at(plan.deliveredAgo - 10, 11) : null,
      createdAt: deliveredAt,
    });
    if (paidCents > 0) {
      await tdb.insert(payments, { receivableId: r.id, amountCents: paidCents, paidOn: iso(daysAgo(plan.paidAgo ?? 0)), method: rnd() > 0.25 ? "pix" : "cash", note: null });
    }
    await tdb.update(batches, { status: plan.paid === "full" ? "closed" : "delivered" }, eq(batches.id, batchId));
  }
  console.log("+ entregas, comprovantes, cobranças e pagamentos");

  /* perfil da calculadora */
  const settings = await tdb.first(workshopSettings);
  if (settings) {
    await tdb.update(
      workshopSettings,
      { calculatorProfile: { fixedMonthlyCents: 450000, payrollMonthlyCents: 1260000, people: 6, hoursPerDay: 9, daysPerMonth: 22, marginPct: 20 } },
      eq(workshopSettings.workshopId, ws.id),
    );
  }
  console.log("pronto");
  process.exit(0);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
