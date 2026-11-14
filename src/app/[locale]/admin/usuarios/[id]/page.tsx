import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "@/components/icons";
import { requireAdmin } from "@/lib/admin";
import { adminUserDetail } from "@/db/admin";
import { formatDate, formatDateTime } from "@/lib/dates";
import { PlanPill, fmtBytes } from "../../ui";
import { AdminUserActions } from "./actions-client";

export default async function AdminUserPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const admin = await requireAdmin();
  const d = await adminUserDetail(id);
  if (!d) notFound();
  const dt = (v: unknown) => (v ? formatDate(String(v), locale) : "—");
  const dtt = (v: unknown) => {
    if (!v) return "—";
    const x = formatDateTime(new Date(String(v)), locale);
    return `${x.date} ${x.time}`;
  };
  const sub = d.subscription as Record<string, unknown> | null;
  const isSelf = d.user.id === admin.id;

  const info: [string, React.ReactNode][] = [
    ["E-mail", d.user.email],
    ["E-mail confirmado", d.user.email_verified ? "sim" : "não"],
    ["Cadastro", dt(d.user.created_at)],
    ["Sessões abertas", `${d.sessions.n}${d.sessions.last ? ` · último acesso ${dtt(d.sessions.last)}` : ""}`],
    ["Papel", d.user.role ?? "user"],
    ["Situação", d.user.banned ? `bloqueado${d.user.ban_reason ? ` (${d.user.ban_reason})` : ""}` : "ativo"],
  ];

  return (
    <div className="space-y-6">
      <Link href="/admin/usuarios" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft aria-hidden="true" className="size-4" /> Usuários
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-hero text-3xl sm:text-4xl">{d.user.email}</h1>
        {d.workshop ? <PlanPill status={d.workshop.plan_status} /> : <PlanPill status="none" />}
        {isSelf ? <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs text-primary-foreground">você</span> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <section className="rounded-3xl border border-ink/[0.06] bg-card p-6 shadow-soft">
            <h2 className="font-medium">Conta</h2>
            <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {info.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="mt-0.5 break-words text-sm font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          {d.workshop ? (
            <section className="rounded-3xl border border-ink/[0.06] bg-card p-6 shadow-soft">
              <h2 className="font-medium">Taller: {d.workshop.name}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {d.workshop.city ?? "—"} · criado em {dt(d.workshop.created_at)} · {d.workshop.role} · cortes grátis usados: {d.workshop.free_batches_used}
              </p>
              <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
                {(
                  [
                    ["Cortes", d.counts.batches],
                    ["Clientes", d.counts.clients],
                    ["Equipe", d.counts.workers],
                    ["Comprov.", d.counts.proofs],
                    ["Fotos", d.counts.photos],
                    ["Espaço", fmtBytes(d.counts.photo_bytes ?? 0)],
                  ] as [string, number | string][]
                ).map(([k, v]) => (
                  <li key={k} className="rounded-2xl bg-mint-50 px-3 py-2.5">
                    <p className="text-[0.6875rem] text-muted-foreground">{k}</p>
                    <p className="font-medium tabular-money">{v ?? 0}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="rounded-3xl border border-ink/[0.06] bg-card p-6 shadow-soft">
            <h2 className="font-medium">Assinatura</h2>
            {sub ? (
              <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                {(
                  [
                    ["Status interno", String(sub.status ?? "—")],
                    ["Forma", String(sub.method ?? "—")],
                    ["Período até", dt(sub.current_period_end)],
                    ["Teste até", dt(sub.trial_ends_at)],
                    ["1ª cobrança", dt(sub.first_charged_at)],
                    ["Cancelada em", dt(sub.canceled_at)],
                    ["Reembolso pedido", dt(sub.refund_requested_at)],
                    ["AbacatePay (assinatura)", String(sub.abacate_subscription_id ?? "—")],
                    ["AbacatePay (checkout)", String(sub.abacate_checkout_id ?? "—")],
                    ["AbacatePay (cliente)", String(sub.abacate_customer_id ?? "—")],
                  ] as [string, string][]
                ).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="mt-0.5 break-all font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Nunca abriu checkout.</p>
            )}
          </section>

          {d.audit.length ? (
            <section className="rounded-3xl border border-ink/[0.06] bg-card p-6 shadow-soft">
              <h2 className="font-medium">Atividade recente</h2>
              <ul className="mt-3 space-y-1.5 text-sm">
                {d.audit.map((a, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="font-mono text-xs">{a.event}</span>
                    <span className="text-xs text-muted-foreground">{dtt(a.occurred_at)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <AdminUserActions
          locale={locale}
          userId={d.user.id}
          email={d.user.email}
          banned={Boolean(d.user.banned)}
          isSelf={isSelf}
          workshopId={d.workshop?.id ?? null}
          planStatus={d.workshop?.plan_status ?? null}
        />
      </div>
    </div>
  );
}
