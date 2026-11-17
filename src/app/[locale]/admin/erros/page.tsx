import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Search } from "@/components/icons";
import { requireAdmin } from "@/lib/admin";
import { adminErrorGroups, adminErrorStats } from "@/db/admin";
import { formatDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { ResolveErrorButton } from "./resolve-button";
import { SOURCE_LABEL, LevelPill } from "./labels";

type SP = { q?: string; status?: string; level?: string; days?: string };

export default async function AdminErrors({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<SP> }) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  await requireAdmin();
  const q = (sp.q ?? "").slice(0, 120);
  const status = sp.status === "all" ? "all" : "open";
  const level = sp.level === "error" || sp.level === "warn" ? sp.level : "all";
  const days = [1, 7, 30, 90].includes(Number(sp.days)) ? Number(sp.days) : 30;
  const [stats, groups] = await Promise.all([adminErrorStats(), adminErrorGroups({ q, status, level, days })]);
  const when = (v: string) => {
    const x = formatDateTime(new Date(v), locale);
    return `${x.date} ${x.time}`;
  };
  const href = (patch: Partial<SP>) => {
    const p = new URLSearchParams({ ...(q ? { q } : {}), status, level, days: String(days), ...patch } as Record<string, string>);
    return `/admin/erros?${p.toString()}`;
  };
  const chip = (active: boolean) => cn("inline-flex min-h-10 items-center rounded-full px-3.5 text-sm", active ? "bg-primary text-primary-foreground" : "border border-ink/10 bg-card hover:bg-mint-50");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-hero text-4xl sm:text-5xl">Erros</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Tudo que deu errado no servidor e no navegador das pessoas. Quem pede suporte manda o código que viu na tela: busque por ele, pelo e-mail ou por um pedaço da mensagem.
          </p>
        </div>
        <form className="relative w-full max-w-sm" role="search">
          <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="q" className="sr-only">
            Buscar por código, e-mail, mensagem ou página
          </label>
          <input id="q" name="q" defaultValue={q} placeholder="Código, e-mail, mensagem ou página" className="min-h-12 w-full rounded-full border border-input/70 bg-card pl-11 pr-4" />
          <input type="hidden" name="status" value={q ? "all" : status} />
          <input type="hidden" name="days" value={q ? "90" : String(days)} />
        </form>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(
          [
            ["Abertos (tipos de erro)", stats.open_groups, "erros diferentes ainda não resolvidos"],
            ["Abertos nas últimas 24 h", stats.open1, "ocorrências de erro"],
            ["Últimas 24 h", stats.d1, "inclui avisos"],
            ["Últimos 7 dias", stats.d7, "inclui avisos"],
          ] as [string, number, string][]
        ).map(([label, v, hint]) => (
          <li key={label} className="rounded-3xl border border-ink/[0.06] bg-card p-6 shadow-soft">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={cn("mt-1 text-4xl font-light tabular-money", label.startsWith("Abertos") && v > 0 && "text-overdue-calote-fg")}>{v}</p>
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          </li>
        ))}
      </ul>

      <nav aria-label="Filtros" className="flex flex-wrap items-center gap-2">
        <Link href={href({ status: "open" })} className={chip(status === "open")}>
          Abertos
        </Link>
        <Link href={href({ status: "all" })} className={chip(status === "all")}>
          Todos
        </Link>
        <span className="mx-1 h-6 w-px bg-ink/10" aria-hidden="true" />
        {(
          [
            ["all", "Erros e avisos"],
            ["error", "Só erros"],
            ["warn", "Só avisos"],
          ] as const
        ).map(([k, l]) => (
          <Link key={k} href={href({ level: k })} className={chip(level === k)}>
            {l}
          </Link>
        ))}
        <span className="mx-1 h-6 w-px bg-ink/10" aria-hidden="true" />
        {[1, 7, 30, 90].map((d) => (
          <Link key={d} href={href({ days: String(d) })} className={chip(days === d)}>
            {d === 1 ? "24 h" : `${d} dias`}
          </Link>
        ))}
        {q ? (
          <Link href="/admin/erros" className="ml-auto text-sm text-primary underline underline-offset-4">
            Limpar busca “{q}”
          </Link>
        ) : null}
      </nav>

      {groups.length ? (
        <ul className="space-y-3">
          {groups.map((g) => (
            <li key={g.fingerprint} className={cn("rounded-3xl border bg-card p-5 shadow-soft", g.open > 0 && g.level === "error" ? "border-overdue-calote-border/50" : "border-ink/[0.06]")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <LevelPill level={g.level} />
                    <span className="rounded-full bg-ink/[0.06] px-2.5 py-0.5 text-xs">{SOURCE_LABEL[g.source] ?? g.source}</span>
                    <span className="font-mono text-xs text-muted-foreground">{g.event}</span>
                    {g.open === 0 ? <span className="rounded-full bg-mint-100 px-2.5 py-0.5 text-xs text-vivid-strong">resolvido</span> : null}
                  </div>
                  <Link href={`/admin/erros/${g.last_id}`} className="mt-2 line-clamp-2 block break-words font-medium underline-offset-4 hover:underline">
                    {g.message || "(sem mensagem)"}
                  </Link>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {g.path ? <span className="font-mono">{g.path}</span> : "sem página"} · último {when(g.last_at)} · código {g.last_ref}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-light tabular-money">{g.total}×</p>
                    <p className="text-xs text-muted-foreground">
                      {g.users} pessoa{g.users === 1 ? "" : "s"}
                      {g.open > 0 && g.open < g.total ? ` · ${g.open} aberto${g.open === 1 ? "" : "s"}` : ""}
                    </p>
                  </div>
                  <ResolveErrorButton fingerprint={g.fingerprint} resolved={g.open === 0} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-3xl border border-ink/[0.06] bg-card p-10 text-center shadow-soft">
          <p className="text-lg font-medium">{q ? "Nada encontrado com essa busca" : status === "open" ? "Nenhum erro aberto" : "Nenhum erro nesse período"}</p>
          <p className="mt-1 text-sm text-muted-foreground">{q ? "Confira o código (letras e números) ou tente o e-mail da pessoa." : "Quando algo der errado, aparece aqui com o código que a pessoa viu."}</p>
        </div>
      )}
    </div>
  );
}
