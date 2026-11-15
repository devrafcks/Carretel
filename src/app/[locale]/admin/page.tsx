import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/admin";
import { adminListUsers, adminOverview, adminPricing, adminRecentWebhooks } from "@/db/admin";
import { cyclePriceCents, foundersLeft, isPriceTier } from "@/lib/pricing";
import { brand } from "@/config/brand";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { PlanPill, fmtBytes } from "./ui";

/** Limite de armazenamento do plano grátis do Neon (0,5 GB por projeto). */
const NEON_FREE_BYTES = 512 * 1024 * 1024;

export default async function AdminHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireAdmin();
  const [o, recent, hooks, pr] = await Promise.all([adminOverview(), adminListUsers(), adminRecentWebhooks(8), adminPricing()]);
  const paying = (o.plans.active ?? 0) + (o.plans.past_due ?? 0);
  const cfg = brand.pricing;
  // MRR: mensal pelo preço da faixa; anual dividido por 12
  const mrr = pr.paying.reduce((a, x) => {
    const tier = isPriceTier(x.tier) ? x.tier : "founder";
    const cents = x.cycle === "annual" ? Math.round(cyclePriceCents(tier, "annual", cfg) / 12) : cyclePriceCents(tier, "monthly", cfg);
    return a + cents * x.n;
  }, 0);
  const count = (tier: string, cycle: string) => pr.paying.filter((x) => x.tier === tier && x.cycle === cycle).reduce((a, x) => a + x.n, 0);
  const brl = (c: number) => formatBRL(c, locale);
  const storagePct = Math.min(100, (o.dbBytes / NEON_FREE_BYTES) * 100);

  const stats: [string, string, string?][] = [
    ["Usuários", String(o.users), `+${o.users7} em 7 dias · +${o.users30} em 30`],
    ["Assinantes pagando", String(paying), `${o.plans.trialing ?? 0} em teste grátis`],
    ["Receita mensal (MRR)", brl(mrr), `${count("founder", "monthly")} × ${brl(cfg.founderMonthlyCents)} · ${count("standard", "monthly")} × ${brl(cfg.standardMonthlyCents)} · ${count("founder", "annual") + count("standard", "annual")} anuais`],
    ["Vagas de fundador", `${Math.min(pr.founders, cfg.founderSpots)} de ${cfg.founderSpots}`, foundersLeft(pr.founders, cfg.founderSpots) > 0 ? `restam ${foundersLeft(pr.founders, cfg.founderSpots)} · depois, ${brl(cfg.standardMonthlyCents)}/mês` : `esgotadas · novas assinaturas a ${brl(cfg.standardMonthlyCents)}/mês`],
    ["Talleres", String(o.workshops), `${o.plans.free ?? 0} grátis · ${o.plans.canceled ?? 0} cancelados`],
    ["Cortes registrados", String(o.batches), `+${o.batches30} em 30 dias`],
    ["Comprovantes", String(o.proofs), `a receber nos talleres: ${formatBRL(o.openReceivablesCents, locale)}`],
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-hero text-4xl sm:text-5xl">Visão geral</h1>
        <p className="mt-2 text-muted-foreground">Tudo o que importa do Carretel, de todos os talleres.</p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(([k, v, hint]) => (
          <li key={k} className="rounded-3xl border border-ink/[0.06] bg-card p-6 shadow-soft">
            <p className="text-sm text-muted-foreground">{k}</p>
            <p className="mt-1 text-4xl font-light tabular-money">{v}</p>
            {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
          </li>
        ))}
      </ul>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-ink/[0.06] bg-card p-6 shadow-soft">
          <h2 className="font-medium">Planos</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {Object.entries(o.plans).map(([k, n]) => (
              <li key={k} className="inline-flex items-center gap-2">
                <PlanPill status={k} /> <span className="tabular-money text-sm">{n}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-3xl border border-ink/[0.06] bg-card p-6 shadow-soft">
          <h2 className="font-medium">Banco de dados</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {fmtBytes(o.dbBytes)} de {fmtBytes(NEON_FREE_BYTES)} do plano grátis do Neon · fotos: {o.photos} ({fmtBytes(o.photoBytes)})
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
    </div>
  );
}
