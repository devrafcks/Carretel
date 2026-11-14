import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Search } from "@/components/icons";
import { requireAdmin } from "@/lib/admin";
import { adminListUsers } from "@/db/admin";
import { formatDate } from "@/lib/dates";
import { PlanPill } from "../ui";

export default async function AdminUsers({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string }> }) {
  const { locale } = await params;
  const { q = "" } = await searchParams;
  setRequestLocale(locale);
  await requireAdmin();
  const users = await adminListUsers(q.slice(0, 80));
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-hero text-4xl sm:text-5xl">Usuários</h1>
          <p className="mt-2 text-muted-foreground">{users.length} encontrado(s)</p>
        </div>
        <form className="relative w-full max-w-sm" role="search">
          <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="q" className="sr-only">
            Buscar por e-mail, nome ou taller
          </label>
          <input id="q" name="q" defaultValue={q} placeholder="Buscar por e-mail, nome ou taller" className="min-h-12 w-full rounded-full border border-input/70 bg-card pl-11 pr-4" />
        </form>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-ink/[0.06] bg-card shadow-soft">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead className="border-b border-ink/[0.06] text-xs text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">E-mail</th>
              <th className="px-5 py-3 font-medium">Taller</th>
              <th className="px-5 py-3 font-medium">Plano</th>
              <th className="px-5 py-3 font-medium">Cortes</th>
              <th className="px-5 py-3 font-medium">Cadastro</th>
              <th className="px-5 py-3 font-medium">Último acesso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/[0.05]">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-mint-50">
                <td className="px-5 py-3">
                  <Link href={`/admin/usuarios/${u.id}`} className="font-medium underline-offset-4 hover:underline">
                    {u.email}
                  </Link>
                  {u.banned ? <span className="ml-2 rounded-full bg-overdue-calote-bg px-2 py-0.5 text-xs text-overdue-calote-fg">bloqueado</span> : null}
                  {u.role === "admin" ? <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">admin</span> : null}
                </td>
                <td className="px-5 py-3">{u.workshop_name ?? <span className="text-muted-foreground">—</span>}</td>
                <td className="px-5 py-3">
                  <PlanPill status={u.plan_status ?? "none"} />
                </td>
                <td className="px-5 py-3 tabular-money">{u.batches}</td>
                <td className="px-5 py-3 text-muted-foreground">{formatDate(u.created_at, locale)}</td>
                <td className="px-5 py-3 text-muted-foreground">{u.last_seen ? formatDate(u.last_seen, locale) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
