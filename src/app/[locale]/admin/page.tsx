import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/admin";
import { adminActiveGrants, adminAttention, adminListUsers, adminOverview, adminPricing, adminRecentWebhooks } from "@/db/admin";
import { cyclePriceCents, foundersLeft, isPriceTier } from "@/lib/pricing";
import { brand } from "@/config/brand";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { PlanPill, TierPill, fmtBytes } from "./ui";
import { CircleCheck, Download, TriangleAlert } from "@/components/icons";
import { BACKUP_KEEP, listBackups } from "@/server/backup";

const PLAN_ORDER = ["active", "trialing", "past_due", "pending_checkout", "free", "canceled", "read_only"] as const;
const PLAN_BAR: Record<string, string> = {
  active: "bg-vivid-strong",
  trialing: "bg-vivid",
  past_due: "bg-overdue-calote-fg",
  pending_checkout: "bg-awaiting-confirmation-solid",
  free: "bg-ink/25",
  canceled: "bg-ink/45",
  read_only: "bg-ink/65",
};

/** Limite de armazenamento do plano grátis do Supabase (500 MB por projeto). */
const DB_FREE_BYTES = 500 * 1024 * 1024;

/** Hora atual fora do render (regra de pureza do lint). */
function nowMs(): number {
  return Date.now();
}

export default async function AdminHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin();
  const [o, recent, hooks, pr, att, backups, grants] = await Promise.all([
    adminOverview(),
    adminListUsers(),
    adminRecentWebhooks(8),
    adminPricing(),
    adminAttention(),
    listBackups().catch(() => []),
    adminActiveGrants(),
  ]);
  // cortesia (liberado pelo admin) não paga: fica fora dos pagantes
  const paying = Math.max(0, (o.plans.active ?? 0) + (o.plans.past_due ?? 0) - o.courtesy);
  const soon = nowMs() + 7 * 86_400_000;
  const cfg = brand.pricing;
  // MRR: mensal pelo preço da faixa; anual dividido por 12
  const mrr = pr.paying.reduce((a, x) => {
    const tier = isPriceTier(x.tier) ? x.tier : "founder";
    const cents = x.cycle === "annual" ? Math.round(cyclePriceCents(tier, "annual", cfg) / 12) : cyclePriceCents(tier, "monthly", cfg);
    return a + cents * x.n;
  }, 0);
  const count = (tier: string, cycle: string) => pr.paying.filter((x) => x.tier === tier && x.cycle === cycle).reduce((a, x) => a + x.n, 0);
  const brl = (c: number) => formatBRL(c, locale);
  const storagePct = Math.min(100, (o.dbBytes / DB_FREE_BYTES) * 100);

  const pct = (n: number, d: number) => (d > 0 ? `${Math.round((n / d) * 100)}%` : "—");
  const left = foundersLeft(pr.founders, cfg.founderSpots);
  const annualCount = count("founder", "annual") + count("standard", "annual");
  type Stat = { label: string; value: string; hint?: string };
  const revenue: Stat[] = [
    { label: "Receita mensal (MRR)", value: brl(mrr), hint: `${count("founder", "monthly")} × ${brl(cfg.founderMonthlyCents)} · ${count("standard", "monthly")} × ${brl(cfg.standardMonthlyCents)} · ${annualCount} anual${annualCount === 1 ? "" : "is"}` },
    { label: "Receita anualizada", value: brl(mrr * 12), hint: "MRR × 12" },
    { label: "Assinantes pagando", value: String(paying), hint: `${o.plans.trialing ?? 0} em teste grátis · ${o.plans.past_due ?? 0} com cobrança pendente · ${o.courtesy} cortesia${o.courtesy === 1 ? "" : "s"}` },
    {
      label: "Vagas de fundador",
      value: `${Math.min(pr.founders, cfg.founderSpots)} de ${cfg.founderSpots}`,
      hint: left > 0 ? `restam ${left} · depois, ${brl(cfg.standardMonthlyCents)}/mês` : `esgotadas · novas a ${brl(cfg.standardMonthlyCents)}/mês`,
    },
  ];
  const usage: Stat[] = [
    { label: "Usuários", value: String(o.users), hint: `+${o.users7} em 7 dias · +${o.users30} em 30` },
    { label: "Talleres", value: String(o.workshops), hint: `conversão para pago: ${pct(paying, o.workshops)}` },
    { label: "Cortes registrados", value: String(o.batches), hint: `+${o.batches30} em 30 dias` },
    { label: "Comprovantes", value: String(o.proofs), hint: `a receber nos talleres: ${brl(o.openReceivablesCents)}` },
  ];
  const attentionCount = att.pastDue.length + att.refunds.length + att.staleCheckouts + att.webhookErrors7;
  const planTotal = Object.values(o.plans).reduce((a, n) => a + n, 0);

  const statGrid = (title: string, items: Stat[]) => (
    <section aria-label={title} className="space-y-3">
      <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{title}</h2>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((it) => (
          <li key={it.label} className="rounded-3xl border border-ink/[0.06] bg-card p-6 shadow-soft">
            <p className="text-sm text-muted-foreground">{it.label}</p>
            <p className="mt-1 text-4xl font-light tabular-money">{it.value}</p>
            {it.hint ? <p className="mt-1 text-xs text-muted-foreground">{it.hint}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-hero text-4xl sm:text-5xl">Visão geral</h1>
        <p className="mt-2 text-muted-foreground">Tudo o que importa do Carretel, de todos os talleres.</p>
      </div>

      <section aria-labelledby="att-title" className={attentionCount ? "rounded-3xl border border-overdue-calote-border bg-overdue-calote-bg p-6" : "rounded-3xl border border-ink/[0.06] bg-card p-6 shadow-soft"}>
        <h2 id="att-title" className="flex items-center gap-2 font-medium">
          {attentionCount ? <TriangleAlert aria-hidden="true" className="size-5 text-overdue-calote-fg" /> : <CircleCheck aria-hidden="true" className="size-5 text-vivid-strong" />}
          {attentionCount ? "Precisa de atenção" : "Nada pedindo atenção agora"}
        </h2>
        {attentionCount ? (
          <ul className="mt-3 space-y-2 text-sm">
            {att.pastDue.map((w) => (
              <li key={`pd-${w.id}`}>
                Cobrança falhando: <Link href={`/admin/usuarios?q=${encodeURIComponent(w.name)}`} className="font-medium underline underline-offset-4">{w.name}</Link>
                {w.since ? <span className="text-muted-foreground"> · desde {formatDate(w.since, locale)}</span> : null}
              </li>
            ))}
            {att.refunds.map((w) => (
              <li key={`rf-${w.id}`}>
                Reembolso pedido: <Link href={`/admin/usuarios?q=${encodeURIComponent(w.name)}`} className="font-medium underline underline-offset-4">{w.name}</Link>
                <span className="text-muted-foreground"> · {formatDate(w.at, locale)} (devolva na AbacatePay e marque “Reembolso resolvido” no usuário)</span>
              </li>
            ))}
            {att.staleCheckouts ? <li>{att.staleCheckouts} checkout{att.staleCheckouts === 1 ? "" : "s"} aberto{att.staleCheckouts === 1 ? "" : "s"} há mais de 1 dia sem pagamento</li> : null}
            {att.webhookErrors7 ? <li>{att.webhookErrors7} evento{att.webhookErrors7 === 1 ? "" : "s"} da AbacatePay com erro nos últimos 7 dias</li> : null}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">Sem cobrança falhando, reembolso pedido, checkout parado ou erro de webhook.</p>
        )}
      </section>

      {grants.length ? (
        <section aria-labelledby="grants-title" className="rounded-3xl border border-ink/[0.06] bg-card p-6 shadow-soft">
          <h2 id="grants-title" className="font-medium">Cortesias ativas ({grants.length})</h2>
          <p className="mt-1 text-sm text-muted-foreground">Plano completo liberado por você, sem cobrança. No fim do prazo volta sozinho para o grátis.</p>
          <ul className="mt-3 divide-y divide-ink/[0.06] text-sm">
            {grants.map((g) => {
              const ending = g.until ? new Date(g.until).getTime() < soon : false;
              return (
                <li key={g.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5">
                  <span className="min-w-0">
                    {g.user_id ? (
                      <Link href={`/admin/usuarios/${g.user_id}`} className="font-medium underline underline-offset-4">
                        {g.name}
                      </Link>
                    ) : (
                      <span className="font-medium">{g.name}</span>
                    )}
                    {g.email ? <span className="text-muted-foreground"> · {g.email}</span> : null}
                    {g.note ? <span className="block text-xs text-muted-foreground">{g.note}</span> : null}
                  </span>
                  <span className={ending ? "rounded-full bg-awaiting-confirmation-bg px-2.5 py-0.5 text-xs font-medium text-awaiting-confirmation-fg" : "text-xs text-muted-foreground"}>
                    {g.until ? `${ending ? "vence " : "até "}${formatDate(g.until, locale)}` : "sem prazo"}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {statGrid("Receita", revenue)}
      {statGrid("Uso", usage)}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-ink/[0.06] bg-card p-6 shadow-soft">
          <h2 className="font-medium">Planos dos talleres</h2>
          {planTotal ? (
            <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-mint-50" aria-hidden="true">
              {PLAN_ORDER.filter((k) => o.plans[k]).map((k) => (
                <span key={k} className={PLAN_BAR[k]} style={{ width: `${(o.plans[k]! / planTotal) * 100}%` }} />
              ))}
            </div>
          ) : null}
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            {PLAN_ORDER.filter((k) => o.plans[k]).map((k) => (
              <li key={k} className="inline-flex items-center gap-2">
                <PlanPill status={k} /> <span className="tabular-money text-sm">{o.plans[k]}</span>
                <span className="text-xs text-muted-foreground">{pct(o.plans[k]!, planTotal)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-3xl border border-ink/[0.06] bg-card p-6 shadow-soft">
          <h2 className="font-medium">Banco de dados</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {fmtBytes(o.dbBytes)} de {fmtBytes(DB_FREE_BYTES)} do plano grátis do Supabase · fotos: {o.photos} ({fmtBytes(o.photoBytes)})
          </p>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-mint-50">
            <div className={storagePct > 80 ? "h-full rounded-full bg-overdue-calote-fg" : "h-full rounded-full bg-vivid"} style={{ width: `${Math.max(2, storagePct)}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">{storagePct.toFixed(1).replace(".", ",")}% usado</p>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-3xl border border-ink/[0.06] bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Cadastros recentes</h2>
            <Link href="/admin/usuarios" className="text-sm underline underline-offset-4">
              Ver todos
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-ink/[0.06]">
            {recent.slice(0, 8).map((u) => (
              <li key={u.id}>
                <Link href={`/admin/usuarios/${u.id}`} className="flex items-center gap-3 py-2.5 hover:text-vivid-strong">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{u.email}</span>
                    <span className="block truncate text-xs text-muted-foreground">{u.workshop_name ?? "sem taller"} · {formatDate(u.created_at, locale)}</span>
                  </span>
                  {u.price_tier ? <TierPill tier={u.price_tier} cycle={u.billing_cycle} /> : null}
                  <PlanPill status={u.plan_status ?? "none"} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-3xl border border-ink/[0.06] bg-card p-6 shadow-soft">
          <h2 className="font-medium">Eventos da AbacatePay</h2>
          {hooks.length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {hooks.map((h) => (
                <li key={h.id} className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-xs">{h.type}</span>
                    {h.error ? <span className="block truncate text-xs text-overdue-calote-fg">{h.error}</span> : null}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDate(h.received_at, locale)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Nenhum evento ainda (o webhook só chega com o site no ar).</p>
          )}
        </section>
      </div>

      <section className="rounded-3xl border border-ink/[0.06] bg-card p-6 shadow-soft">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-medium">Cópias do banco</h2>
          <p className="text-xs text-muted-foreground">Todo dia às 3h (Brasília), as {BACKUP_KEEP} mais recentes, guardadas no Vercel Blob (privado).</p>
        </div>
        {backups.length ? (
          <ul className="mt-3 divide-y divide-ink/[0.06] text-sm">
            {backups.map((b) => (
              <li key={b.pathname} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0 truncate font-mono text-xs">{b.pathname.replace("backups/", "")}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{fmtBytes(b.size)}</span>
                <a href={`/api/admin/backup?name=${encodeURIComponent(b.pathname)}`} download className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-ink/15 px-3 text-xs font-medium hover:border-ink/40">
                  <Download aria-hidden="true" className="size-3.5" /> Baixar
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Ainda não há cópias. A primeira é feita na próxima rodada diária (ou na hora, chamando /api/cron/retention com o CRON_SECRET).</p>
        )}
      </section>
    </div>
  );
}
