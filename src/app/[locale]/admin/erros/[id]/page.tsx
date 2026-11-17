import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "@/components/icons";
import { requireAdmin } from "@/lib/admin";
import { adminErrorDetail } from "@/db/admin";
import { formatDateTime } from "@/lib/dates";
import { deviceSummary } from "@/lib/error-report";
import { ResolveErrorButton } from "../resolve-button";
import { LevelPill, SOURCE_LABEL } from "../labels";

export default async function AdminErrorDetail({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireAdmin();
  if (!/^\d{1,18}$/.test(id)) notFound();
  const d = await adminErrorDetail(Number(id));
  if (!d) notFound();
  const r = d.row as unknown as Record<string, string | null> & { context: unknown };
  const when = (v: unknown) => {
    if (!v) return "—";
    const x = formatDateTime(new Date(String(v)), locale);
    return `${x.date} ${x.time}`;
  };
  const info: [string, React.ReactNode][] = [
    ["Código", <span key="c" className="font-mono">{r.ref}</span>],
    ["Quando", when(r.occurred_at)],
    ["Onde", SOURCE_LABEL[r.source ?? ""] ?? r.source],
    ["Evento", <span key="e" className="font-mono">{r.event}</span>],
    ["Página", r.path ? <span className="font-mono">{r.path}</span> : "—"],
    ["Método", r.method ?? "—"],
    [
      "Pessoa",
      r.user_email ? (
        <Link key="u" href={`/admin/usuarios/${r.user_id}`} className="underline underline-offset-4">
          {r.user_email}
        </Link>
      ) : (
        "não logada / desconhecida"
      ),
    ],
    ["Taller", r.workshop_name ?? "—"],
    ["Aparelho", r.user_agent ? deviceSummary(r.user_agent) : "—"],
    ["Digest (Next)", r.digest ? <span className="font-mono">{r.digest}</span> : "—"],
  ];

  return (
    <div className="space-y-6">
      <Link href="/admin/erros" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft aria-hidden="true" className="size-4" /> Erros
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <LevelPill level={r.level ?? "error"} />
            {d.open === 0 ? <span className="rounded-full bg-mint-100 px-2.5 py-0.5 text-xs text-vivid-strong">resolvido</span> : null}
            <span className="text-sm text-muted-foreground">
              aconteceu {d.total}× · {d.open} aberto{d.open === 1 ? "" : "s"}
            </span>
          </div>
          <h1 className="mt-2 break-words text-2xl font-semibold sm:text-3xl">{r.message || "(sem mensagem)"}</h1>
        </div>
        <ResolveErrorButton fingerprint={r.fingerprint!} resolved={d.open === 0} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="min-w-0 space-y-4">
          <section className="rounded-3xl border border-ink/[0.06] bg-card p-6 shadow-soft">
            <h2 className="font-medium">Detalhes</h2>
            <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {info.map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="text-xs text-muted-foreground">{k}</dt>
                  <dd className="mt-0.5 break-words text-sm font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
          {r.stack ? (
            <section className="rounded-3xl border border-ink/[0.06] bg-card p-6 shadow-soft">
              <h2 className="font-medium">Onde no código (stack)</h2>
              <pre className="mt-3 max-h-[28rem] overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-ink/[0.04] p-4 font-mono text-xs leading-relaxed">{r.stack}</pre>
            </section>
          ) : null}
          {r.context ? (
            <section className="rounded-3xl border border-ink/[0.06] bg-card p-6 shadow-soft">
              <h2 className="font-medium">Contexto</h2>
              <pre className="mt-3 overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-ink/[0.04] p-4 font-mono text-xs">{JSON.stringify(r.context, null, 2)}</pre>
            </section>
          ) : null}
          {r.user_agent ? <p className="break-words text-xs text-muted-foreground">Navegador completo: {r.user_agent}</p> : null}
        </div>

        <section className="h-fit rounded-3xl border border-ink/[0.06] bg-card p-6 shadow-soft">
          <h2 className="font-medium">Outras vezes que aconteceu</h2>
          <ul className="mt-3 divide-y divide-ink/[0.06] text-sm">
            {d.others.map((o) => (
              <li key={o.id} className="flex items-baseline justify-between gap-3 py-2">
                <Link href={`/admin/erros/${o.id}`} className={o.id === Number(id) ? "font-mono font-semibold" : "font-mono underline-offset-4 hover:underline"}>
                  {o.ref}
                </Link>
                <span className="min-w-0 truncate text-xs text-muted-foreground">{o.email ?? o.path ?? ""}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{when(o.occurred_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
