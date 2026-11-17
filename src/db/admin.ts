/**
 * Consultas e operações do PAINEL ADMIN. Atravessam todas as oficinas de propósito,
 * então só podem ser chamadas depois de requireAdmin() (src/lib/admin.ts). Toda escrita é auditada pela ação.
 */
import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "./client";
import { deleteBlobs } from "@/server/media-store";

type Row = Record<string, unknown>;
async function q<T = Row>(query: ReturnType<typeof sql>): Promise<T[]> {
  const db = await getDb();
  const res = (await db.execute(query)) as unknown as { rows: T[] };
  return res.rows;
}

export type AdminOverview = {
  users: number;
  users7: number;
  users30: number;
  workshops: number;
  plans: Record<string, number>;
  batches: number;
  batches30: number;
  proofs: number;
  photos: number;
  photoBytes: number;
  dbBytes: number;
  openReceivablesCents: number;
  /** planos ativos liberados pelo admin (sem cobrança) */
  courtesy: number;
};

export async function adminOverview(): Promise<AdminOverview> {
  const [u] = await q<{ total: number; d7: number; d30: number }>(sql`
    select count(*)::int total,
      count(*) filter (where "createdAt" > now() - interval '7 days')::int d7,
      count(*) filter (where "createdAt" > now() - interval '30 days')::int d30
    from app_auth."user"`);
  const plans = await q<{ plan_status: string; n: number }>(sql`select plan_status, count(*)::int n from workshops where deleted_at is null group by plan_status`);
  const [b] = await q<{ total: number; d30: number }>(sql`select count(*)::int total, count(*) filter (where created_at > now() - interval '30 days')::int d30 from batches`);
  const [p] = await q<{ n: number }>(sql`select count(*)::int n from delivery_proofs`);
  const [m] = await q<{ n: number; bytes: string }>(sql`select count(*)::int n, coalesce(sum(bytes),0)::bigint bytes from media_assets where deleted_at is null`);
  const [d] = await q<{ bytes: string }>(sql`select pg_database_size(current_database())::bigint bytes`);
  const [g] = await q<{ n: number }>(sql`
    select count(*)::int n from workshops w left join subscriptions s on s.workshop_id = w.id
    where w.deleted_at is null and w.plan_status in ('active', 'trialing')
      and (s.granted_at is not null or s.id is null or (s.abacate_subscription_id is null and s.abacate_checkout_id is null and s.first_charged_at is null))`);
  const [r] = await q<{ cents: string }>(sql`select coalesce(sum(amount_cents - paid_cents),0)::bigint cents from receivables where status in ('open','partially_paid','awaiting_confirmation','disputed')`);
  return {
    users: u?.total ?? 0,
    users7: u?.d7 ?? 0,
    users30: u?.d30 ?? 0,
    workshops: plans.reduce((a, x) => a + x.n, 0),
    plans: Object.fromEntries(plans.map((x) => [x.plan_status, x.n])),
    batches: b?.total ?? 0,
    batches30: b?.d30 ?? 0,
    proofs: p?.n ?? 0,
    photos: m?.n ?? 0,
    photoBytes: Number(m?.bytes ?? 0),
    dbBytes: Number(d?.bytes ?? 0),
    openReceivablesCents: Number(r?.cents ?? 0),
    courtesy: g?.n ?? 0,
  };
}

export type AdminPricing = {
  /** oficinas que ocupam vaga de fundador (pagaram ou começaram o teste nessa faixa) */
  founders: number;
  /** pagantes (ativo ou cobrança pendente) por faixa e ciclo */
  paying: { tier: string; cycle: string; n: number }[];
};

/** Faixas de preço: vagas de fundador ocupadas e pagantes por faixa/ciclo (para o MRR). */
export async function adminPricing(): Promise<AdminPricing> {
  const [f] = await q<{ n: number }>(sql`
    select count(*)::int n from subscriptions
    where founder_at is not null or (price_tier = 'founder' and (first_charged_at is not null or trial_ends_at is not null or abacate_subscription_id is not null))`);
  const paying = await q<{ tier: string; cycle: string; n: number }>(sql`
    select coalesce(s.price_tier, 'founder') tier, s.billing_cycle cycle, count(*)::int n
    from subscriptions s join workshops w on w.id = s.workshop_id
    where w.deleted_at is null and w.plan_status in ('active', 'past_due') and s.granted_at is null
    group by 1, 2`);
  return { founders: f?.n ?? 0, paying };
}

export type AdminUserRow = {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  role: string | null;
  banned: boolean | null;
  workshop_id: string | null;
  workshop_name: string | null;
  plan_status: string | null;
  price_tier: string | null;
  billing_cycle: string | null;
  batches: number;
  last_seen: string | null;
};

export async function adminListUsers(search = ""): Promise<AdminUserRow[]> {
  // escapa os curingas do LIKE: a busca é por texto literal (o valor já vai como parâmetro, sem injeção)
  const term = search.trim().toLowerCase().slice(0, 120);
  const like = `%${term.replace(/[\\%_]/g, (c) => "\\" + c)}%`;
  return q<AdminUserRow>(sql`
    select u.id::text id, u.email, u.name, u."createdAt" created_at, u.role, u.banned,
      w.id::text workshop_id, w.name workshop_name, w.plan_status, sb.price_tier, sb.billing_cycle,
      (select count(*)::int from batches bb where bb.workshop_id = w.id) batches,
      (select max(s."updatedAt") from app_auth.session s where s."userId" = u.id) last_seen
    from app_auth."user" u
    left join workshop_members m on m.user_id::text = u.id::text
    left join workshops w on w.id = m.workshop_id and w.deleted_at is null
    left join subscriptions sb on sb.workshop_id = w.id
    where ${term === ""} or lower(u.email) like ${like} or lower(coalesce(u.name,'')) like ${like} or lower(coalesce(w.name,'')) like ${like}
    order by u."createdAt" desc
    limit 300`);
}

export async function adminRecentWebhooks(limit = 12) {
  return q<{ id: string; type: string; received_at: string; processed_at: string | null; error: string | null }>(sql`
    select id, type, received_at, processed_at, error from billing_webhook_events order by received_at desc limit ${limit}`);
}

export async function adminUserDetail(userId: string) {
  const [user] = await q<{ id: string; email: string; name: string | null; email_verified: boolean; created_at: string; role: string | null; banned: boolean | null; ban_reason: string | null }>(sql`
    select id::text id, email, name, "emailVerified" email_verified, "createdAt" created_at, role, banned, "banReason" ban_reason
    from app_auth."user" where id::text = ${userId}`);
  if (!user) return null;
  const [sessions] = await q<{ n: number; last: string | null }>(sql`select count(*)::int n, max("updatedAt") last from app_auth.session where "userId"::text = ${userId} and "expiresAt" > now()`);
  const [ws] = await q<{
    id: string;
    name: string;
    city: string | null;
    plan_status: string;
    free_batches_used: number;
    created_at: string;
    admin_note: string | null;
    role: string;
  }>(sql`
    select w.id::text id, w.name, w.city, w.plan_status, w.free_batches_used, w.created_at, w.admin_note, m.role
    from workshop_members m join workshops w on w.id = m.workshop_id
    where m.user_id::text = ${userId} and w.deleted_at is null limit 1`);
  let counts: Record<string, number> = {};
  let sub: Row | null = null;
  let audit: { event: string; occurred_at: string; actor: string; resource: string | null }[] = [];
  if (ws) {
    const [c] = await q<Record<string, number | string>>(sql`
      select
        (select count(*)::int from batches where workshop_id = ${ws.id}::uuid) batches,
        (select count(*)::int from clients where workshop_id = ${ws.id}::uuid) clients,
        (select count(*)::int from workers where workshop_id = ${ws.id}::uuid) workers,
        (select count(*)::int from delivery_proofs where workshop_id = ${ws.id}::uuid) proofs,
        (select count(*)::int from media_assets where workshop_id = ${ws.id}::uuid and deleted_at is null) photos,
        (select coalesce(sum(bytes),0)::bigint from media_assets where workshop_id = ${ws.id}::uuid and deleted_at is null) photo_bytes`);
    counts = Object.fromEntries(Object.entries(c ?? {}).map(([k, v]) => [k, Number(v)]));
    const subs = await q(sql`
      select status, method, price_tier, billing_cycle, abacate_subscription_id, abacate_checkout_id, abacate_customer_id, current_period_end, trial_ends_at, first_charged_at, canceled_at, refund_requested_at, refund_resolved_at, granted_at, grant_note
      from subscriptions where workshop_id = ${ws.id}::uuid`);
    sub = subs[0] ?? null;
    audit = await q(sql`select event, occurred_at, actor, resource from access_audit_logs where workshop_id = ${ws.id}::uuid order by occurred_at desc limit 15`);
  }
  return { user, sessions: sessions ?? { n: 0, last: null }, workshop: ws ?? null, counts, subscription: sub ?? null, audit };
}

/* ───── escrita ───── */
export async function adminSetBanned(userId: string, banned: boolean, reason: string | null) {
  await q(sql`update app_auth."user" set banned = ${banned}, "banReason" = ${banned ? reason : null}, "banExpires" = null, "updatedAt" = now() where id::text = ${userId}`);
  if (banned) await adminRevokeSessions(userId);
}

export async function adminRevokeSessions(userId: string) {
  await q(sql`delete from app_auth.session where "userId"::text = ${userId}`);
}

export async function adminSetPlan(workshopId: string, status: string, periodEnd: Date | null) {
  await q(sql`update workshops set plan_status = ${status}, updated_at = now() where id = ${workshopId}::uuid`);
  if (periodEnd) {
    await q(sql`
      insert into subscriptions (workshop_id, status, current_period_end) values (${workshopId}::uuid, ${status}, ${periodEnd})
      on conflict (workshop_id) do update set status = excluded.status, current_period_end = excluded.current_period_end, updated_at = now()`);
  }
}

export async function adminResetFreeUsage(workshopId: string) {
  await q(sql`update workshops set free_batches_used = 0, free_started_at = now(), updated_at = now() where id = ${workshopId}::uuid`);
}

/* ───── cortesia (plano liberado pelo admin, sem cobrança) ───── */
/** Assinatura paga de verdade em andamento: o admin não deve sobrepor com cortesia (cancele antes). */
export async function adminHasPaidPlan(workshopId: string): Promise<boolean> {
  const [r] = await q<{ n: number }>(sql`
    select count(*)::int n from subscriptions s join workshops w on w.id = s.workshop_id
    where s.workshop_id = ${workshopId}::uuid and s.granted_at is null
      and w.plan_status in ('active', 'trialing', 'past_due')
      and (s.abacate_subscription_id is not null or s.first_charged_at is not null)`);
  return (r?.n ?? 0) > 0;
}

/** Libera o plano completo. periodEnd null = sem prazo. Solta ids antigos da AbacatePay para a conciliação não sobrescrever. */
export async function adminGrantPlan(workshopId: string, periodEnd: Date | null, note: string | null) {
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx.execute(sql`
      insert into subscriptions (workshop_id, status, current_period_end, granted_at, grant_note)
      values (${workshopId}::uuid, 'active', ${periodEnd}, now(), ${note})
      on conflict (workshop_id) do update set status = 'active', current_period_end = excluded.current_period_end,
        granted_at = now(), grant_note = excluded.grant_note, abacate_subscription_id = null, abacate_checkout_id = null,
        checkout_url = null, trial_ends_at = null, canceled_at = null, billing_cycle = 'monthly', updated_at = now()`);
    await tx.execute(sql`update workshops set plan_status = 'active', updated_at = now() where id = ${workshopId}::uuid`);
  });
}

/** Soma dias à cortesia (a partir do fim atual, ou de hoje se já passou) e reativa se tinha vencido. */
export async function adminExtendGrant(workshopId: string, days: number): Promise<boolean> {
  const rows = await q(sql`
    update subscriptions set status = 'active', canceled_at = null,
      current_period_end = greatest(current_period_end, now()) + make_interval(days => ${days}), updated_at = now()
    where workshop_id = ${workshopId}::uuid and granted_at is not null and current_period_end is not null returning id`);
  if (rows.length) await q(sql`update workshops set plan_status = 'active', updated_at = now() where id = ${workshopId}::uuid`);
  return rows.length > 0;
}

/** Encerra a cortesia agora: volta para o plano grátis (os dados ficam). */
export async function adminEndGrant(workshopId: string) {
  await q(sql`update subscriptions set status = 'canceled', current_period_end = now(), canceled_at = now(), updated_at = now() where workshop_id = ${workshopId}::uuid and granted_at is not null`);
  await q(sql`update workshops set plan_status = 'free', updated_at = now() where id = ${workshopId}::uuid`);
}

export async function adminResolveRefund(workshopId: string) {
  await q(sql`update subscriptions set refund_resolved_at = now(), updated_at = now() where workshop_id = ${workshopId}::uuid and refund_requested_at is not null`);
}

export async function adminSaveNote(workshopId: string, note: string | null) {
  await q(sql`update workshops set admin_note = ${note}, updated_at = now() where id = ${workshopId}::uuid`);
}

export type AdminGrantRow = { id: string; name: string; email: string | null; user_id: string | null; until: string | null; note: string | null };

/** Cortesias ativas: as que vencem primeiro no topo (sem prazo por último). */
export async function adminActiveGrants(limit = 50): Promise<AdminGrantRow[]> {
  return q<AdminGrantRow>(sql`
    select w.id::text id, w.name, u.email, u.id::text user_id, s.current_period_end until, s.grant_note note
    from subscriptions s join workshops w on w.id = s.workshop_id
    left join workshop_members m on m.workshop_id = w.id and m.role = 'owner'
    left join app_auth."user" u on u.id::text = m.user_id
    where s.granted_at is not null and w.deleted_at is null and w.plan_status in ('active', 'trialing')
    order by s.current_period_end asc nulls last limit ${limit}`);
}

/** Apaga o usuário e o taller dele de vez (dados em cascata). Irreversível. */
export async function adminDeleteUser(userId: string) {
  const db = await getDb();
  // fotos no Vercel Blob das oficinas que somem junto (o banco apaga em cascata, o Blob não)
  const blobs = await q<{ key: string }>(sql`
    select ma.storage_key key from media_assets ma join workshop_members m on m.workshop_id = ma.workshop_id
    where m.user_id::text = ${userId} and m.role = 'owner' and ma.storage = 'vercel-blob'`);
  await deleteBlobs(blobs.map((b) => b.key));
  await db.transaction(async (tx) => {
    const run = (query: ReturnType<typeof sql>) => tx.execute(query);
    await run(sql`
      delete from workshops where id in (
        select m.workshop_id from workshop_members m where m.user_id::text = ${userId} and m.role = 'owner'
      )`);
    await run(sql`delete from workshop_members where user_id::text = ${userId}`);
    await run(sql`delete from app_auth.session where "userId"::text = ${userId}`);
    await run(sql`delete from app_auth.account where "userId"::text = ${userId}`);
    await run(sql`delete from app_auth."user" where id::text = ${userId}`);
  });
}

/** Garante papel "admin" no Neon Auth para os e-mails da lista (necessário para as rotas /admin/* dele). */
export async function ensureAuthAdminRole(email: string) {
  await q(sql`update app_auth."user" set role = 'admin', "updatedAt" = now() where lower(email) = ${email.toLowerCase()} and coalesce(role,'') <> 'admin'`);
}

export type AdminAttention = {
  pastDue: { id: string; name: string; since: string | null }[];
  refunds: { id: string; name: string; at: string }[];
  staleCheckouts: number;
  webhookErrors7: number;
};

/** O que pede ação do admin: cobrança falhando, reembolso pedido, checkout parado e webhook com erro. */
export async function adminAttention(): Promise<AdminAttention> {
  const pastDue = await q<{ id: string; name: string; since: string | null }>(sql`
    select w.id::text id, w.name, s.updated_at since from workshops w left join subscriptions s on s.workshop_id = w.id
    where w.deleted_at is null and w.plan_status = 'past_due' order by s.updated_at asc limit 10`);
  const refunds = await q<{ id: string; name: string; at: string }>(sql`
    select w.id::text id, w.name, s.refund_requested_at at from subscriptions s join workshops w on w.id = s.workshop_id
    where s.refund_requested_at > now() - interval '30 days' and s.refund_resolved_at is null order by s.refund_requested_at desc limit 10`);
  const [c] = await q<{ n: number }>(sql`
    select count(*)::int n from subscriptions where status = 'pending_checkout' and abacate_checkout_id is not null and updated_at < now() - interval '1 day'`);
  const [e] = await q<{ n: number }>(sql`select count(*)::int n from billing_webhook_events where error is not null and received_at > now() - interval '7 days'`);
  return { pastDue, refunds, staleCheckouts: c?.n ?? 0, webhookErrors7: e?.n ?? 0 };
}

/* ───── erros do sistema (/admin/erros) ───── */
export type AdminErrorGroup = {
  fingerprint: string;
  event: string;
  source: string;
  level: string;
  message: string | null;
  path: string | null;
  total: number;
  open: number;
  users: number;
  first_at: string;
  last_at: string;
  last_id: number;
  last_ref: string;
};

export async function adminErrorStats() {
  const [r] = await q<{ d1: number; d7: number; open_groups: number; open1: number }>(sql`
    select
      count(*) filter (where occurred_at > now() - interval '24 hours')::int d1,
      count(*) filter (where occurred_at > now() - interval '7 days')::int d7,
      count(distinct fingerprint) filter (where resolved_at is null and level = 'error')::int open_groups,
      count(*) filter (where resolved_at is null and level = 'error' and occurred_at > now() - interval '24 hours')::int open1
    from error_logs`);
  return r ?? { d1: 0, d7: 0, open_groups: 0, open1: 0 };
}

/**
 * Erros agrupados (o mesmo erro repetido vira uma linha com contagem). Busca por código, e-mail, mensagem ou página.
 * status "open" = tem ocorrência ainda não resolvida (um erro que volta depois de resolvido reaparece aqui).
 */
export async function adminErrorGroups(opts: { q?: string; status?: "open" | "all"; level?: "error" | "warn" | "all"; days?: number }): Promise<AdminErrorGroup[]> {
  const term = (opts.q ?? "").trim().slice(0, 120);
  const like = `%${term.replace(/[\%_]/g, (m) => "\\" + m)}%`;
  const days = Math.min(Math.max(opts.days ?? 30, 1), 90);
  const level = opts.level ?? "all";
  return q<AdminErrorGroup>(sql`
    with base as (
      select e.*, u.email from error_logs e left join app_auth."user" u on u.id::text = e.user_id
      where e.occurred_at > now() - make_interval(days => ${days})
        and (${level} = 'all' or e.level = ${level})
        and (${term} = '' or e.ref = ${term.toUpperCase()} or e.ref = ${term} or e.digest = ${term}
             or e.message ilike ${like} or e.event ilike ${like} or e.path ilike ${like} or u.email ilike ${like})
    ), g as (
      select fingerprint, count(*)::int total, count(*) filter (where resolved_at is null)::int open,
        count(distinct user_id)::int users, min(occurred_at) first_at, max(occurred_at) last_at
      from base group by fingerprint
    )
    select g.*, l.event, l.source, l.level, l.message, l.path, l.id last_id, l.ref last_ref
    from g join lateral (select * from base b where b.fingerprint = g.fingerprint order by b.occurred_at desc limit 1) l on true
    where (${opts.status ?? "open"} = 'all' or g.open > 0)
    order by g.last_at desc limit 200`);
}

export async function adminErrorDetail(id: number) {
  const [row] = await q<Record<string, unknown> & { fingerprint: string; user_id: string | null; workshop_id: string | null }>(sql`
    select e.*, u.email user_email, w.name workshop_name
    from error_logs e
    left join app_auth."user" u on u.id::text = e.user_id
    left join workshops w on w.id = coalesce(e.workshop_id, (select m.workshop_id from workshop_members m where m.user_id = e.user_id limit 1))
    where e.id = ${id}`);
  if (!row) return null;
  const others = await q<{ id: number; ref: string; occurred_at: string; path: string | null; email: string | null; resolved_at: string | null }>(sql`
    select e.id, e.ref, e.occurred_at, e.path, u.email, e.resolved_at from error_logs e left join app_auth."user" u on u.id::text = e.user_id
    where e.fingerprint = ${row.fingerprint} order by e.occurred_at desc limit 30`);
  const [c] = await q<{ total: number; open: number }>(sql`select count(*)::int total, count(*) filter (where resolved_at is null)::int open from error_logs where fingerprint = ${row.fingerprint}`);
  return { row, others, total: c?.total ?? 0, open: c?.open ?? 0 };
}

/** Marca como resolvidas todas as ocorrências deste erro até agora (se acontecer de novo, volta como aberto). */
export async function adminResolveErrorGroup(fingerprint: string, resolved: boolean) {
  if (resolved) await q(sql`update error_logs set resolved_at = now() where fingerprint = ${fingerprint} and resolved_at is null`);
  else await q(sql`update error_logs set resolved_at = null where fingerprint = ${fingerprint}`);
}
