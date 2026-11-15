/**
 * Consultas e operações do PAINEL ADMIN. Atravessam todas as oficinas de propósito,
 * então só podem ser chamadas depois de requireAdmin() (src/lib/admin.ts). Toda escrita é auditada pela ação.
 */
import "server-only";
import { sql } from "drizzle-orm";
import { getDb } from "./client";

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
};

export async function adminOverview(): Promise<AdminOverview> {
  const [u] = await q<{ total: number; d7: number; d30: number }>(sql`
    select count(*)::int total,
      count(*) filter (where "createdAt" > now() - interval '7 days')::int d7,
      count(*) filter (where "createdAt" > now() - interval '30 days')::int d30
    from neon_auth."user"`);
  const plans = await q<{ plan_status: string; n: number }>(sql`select plan_status, count(*)::int n from workshops where deleted_at is null group by plan_status`);
  const [b] = await q<{ total: number; d30: number }>(sql`select count(*)::int total, count(*) filter (where created_at > now() - interval '30 days')::int d30 from batches`);
  const [p] = await q<{ n: number }>(sql`select count(*)::int n from delivery_proofs`);
  const [m] = await q<{ n: number; bytes: string }>(sql`select count(*)::int n, coalesce(sum(bytes),0)::bigint bytes from media_assets where deleted_at is null`);
  const [d] = await q<{ bytes: string }>(sql`select pg_database_size(current_database())::bigint bytes`);
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
    where price_tier = 'founder' and (first_charged_at is not null or trial_ends_at is not null or abacate_subscription_id is not null)`);
  const paying = await q<{ tier: string; cycle: string; n: number }>(sql`
    select coalesce(s.price_tier, 'founder') tier, s.billing_cycle cycle, count(*)::int n
    from subscriptions s join workshops w on w.id = s.workshop_id
    where w.deleted_at is null and w.plan_status in ('active', 'past_due')
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
  const like = `%${search.trim().toLowerCase()}%`;
  return q<AdminUserRow>(sql`
    select u.id::text id, u.email, u.name, u."createdAt" created_at, u.role, u.banned,
      w.id::text workshop_id, w.name workshop_name, w.plan_status, sb.price_tier, sb.billing_cycle,
      (select count(*)::int from batches bb where bb.workshop_id = w.id) batches,
      (select max(s."updatedAt") from neon_auth.session s where s."userId" = u.id) last_seen
    from neon_auth."user" u
    left join workshop_members m on m.user_id::text = u.id::text
    left join workshops w on w.id = m.workshop_id and w.deleted_at is null
    left join subscriptions sb on sb.workshop_id = w.id
    where ${search.trim() === ""} or lower(u.email) like ${like} or lower(coalesce(u.name,'')) like ${like} or lower(coalesce(w.name,'')) like ${like}
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
    from neon_auth."user" where id::text = ${userId}`);
  if (!user) return null;
  const [sessions] = await q<{ n: number; last: string | null }>(sql`select count(*)::int n, max("updatedAt") last from neon_auth.session where "userId"::text = ${userId} and "expiresAt" > now()`);
  const [ws] = await q<{
    id: string;
    name: string;
    city: string | null;
    plan_status: string;
    free_batches_used: number;
    created_at: string;
    role: string;
  }>(sql`
    select w.id::text id, w.name, w.city, w.plan_status, w.free_batches_used, w.created_at, m.role
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
      select status, method, price_tier, billing_cycle, abacate_subscription_id, abacate_checkout_id, abacate_customer_id, current_period_end, trial_ends_at, first_charged_at, canceled_at, refund_requested_at
      from subscriptions where workshop_id = ${ws.id}::uuid`);
    sub = subs[0] ?? null;
    audit = await q(sql`select event, occurred_at, actor, resource from access_audit_logs where workshop_id = ${ws.id}::uuid order by occurred_at desc limit 15`);
  }
  return { user, sessions: sessions ?? { n: 0, last: null }, workshop: ws ?? null, counts, subscription: sub ?? null, audit };
}

/* ───── escrita ───── */
export async function adminSetBanned(userId: string, banned: boolean, reason: string | null) {
  await q(sql`update neon_auth."user" set banned = ${banned}, "banReason" = ${banned ? reason : null}, "banExpires" = null, "updatedAt" = now() where id::text = ${userId}`);
  if (banned) await adminRevokeSessions(userId);
}

export async function adminRevokeSessions(userId: string) {
  await q(sql`delete from neon_auth.session where "userId"::text = ${userId}`);
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

/** Apaga o usuário e o taller dele de vez (dados em cascata). Irreversível. */
export async function adminDeleteUser(userId: string) {
  const db = await getDb();
  await db.transaction(async (tx) => {
    const run = (query: ReturnType<typeof sql>) => tx.execute(query);
    await run(sql`
      delete from workshops where id in (
        select m.workshop_id from workshop_members m where m.user_id::text = ${userId} and m.role = 'owner'
      )`);
    await run(sql`delete from workshop_members where user_id::text = ${userId}`);
    await run(sql`delete from neon_auth.session where "userId"::text = ${userId}`);
    await run(sql`delete from neon_auth.account where "userId"::text = ${userId}`);
    await run(sql`delete from neon_auth."user" where id::text = ${userId}`);
  });
}

/** Garante papel "admin" no Neon Auth para os e-mails da lista (necessário para as rotas /admin/* dele). */
export async function ensureAuthAdminRole(email: string) {
  await q(sql`update neon_auth."user" set role = 'admin', "updatedAt" = now() where lower(email) = ${email.toLowerCase()} and coalesce(role,'') <> 'admin'`);
}
