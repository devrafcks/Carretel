import { getTranslations, setRequestLocale } from "next-intl/server";
import { Calculator, Users, Team, CreditCard, Accessibility, Shield, FileText, Info, ListChecks, ChevronRight, Package, Sparkles, ChartBar, type AppIcon } from "@/components/icons";
import { sql } from "drizzle-orm";
import { batches, clients, workers } from "@/db/schema";
import { formatDate } from "@/lib/dates";
import { requireWorkshop } from "@/lib/session";
import { PageHeader } from "@/components/app/page-header";
import { Link } from "@/i18n/navigation";
import { InstallHint } from "@/components/app/install-hint";
import { SignOutButton } from "@/components/app/sign-out";
import { authMode } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/admin";
import { WorkshopAvatar } from "@/components/app/avatar";
import { ProBadge } from "@/components/app/premium";

type Entry = { href: string; icon: AppIcon; title: string; desc: string; pro?: boolean };

function Section({ title, entries, showPro = false }: { title: string; entries: Entry[]; showPro?: boolean }) {
  return (
    <section>
      <h2 className="px-1 text-sm font-medium text-muted-foreground">{title}</h2>
      <ul className="mt-3 grid gap-3 md:grid-cols-2">
        {entries.map((e) => (
          <li key={e.href}>
            <Link
              href={e.href}
              className="group flex min-h-20 items-center gap-4 rounded-3xl border border-ink/[0.06] bg-card px-5 py-4 shadow-soft transition-colors hover:border-ink/20"
            >
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-mint-100 text-vivid-strong">
                <e.icon aria-hidden="true" className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-medium">
                  {e.title}
                  {e.pro && showPro ? <ProBadge /> : null}
                </span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{e.desc}</span>
              </span>
              <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function MasPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ctx = await requireWorkshop();
  const t = await getTranslations("more");
  const plan = ctx.workshop.planStatus;
  const planLabel = plan === "free" || plan === "pending_checkout" ? t("plan_free") : plan === "active" || plan === "trialing" ? t("plan_active") : t("plan_other");

  const workshop: Entry[] = [
    { href: "/lotes?f=all", icon: Package, title: t("batches"), desc: t("batchesDesc") },
    { href: "/clientes", icon: Users, title: t("clients"), desc: t("clientsDesc") },
    { href: "/produccion?tab=equipo", icon: Team, title: t("team"), desc: t("teamDesc") },
    { href: "/calculadora", icon: Calculator, title: t("calculator"), desc: t("calculatorDesc") },
    { href: "/relatorios", icon: ChartBar, title: t("reports"), desc: t("reportsDesc"), pro: true },
  ];
  const help: Entry[] = [
    { href: "/accesibilidad", icon: Accessibility, title: t("a11y"), desc: t("a11yDesc") },
    { href: "/privacidad", icon: Shield, title: t("privacy"), desc: t("privacyDesc") },
    { href: "/terminos", icon: FileText, title: t("terms"), desc: t("termsDesc") },
    { href: "/quienes-somos", icon: Info, title: t("about"), desc: t("aboutDesc") },
  ];
  if (process.env.NODE_ENV !== "production") help.push({ href: "/go-live", icon: ListChecks, title: t("golive"), desc: t("goliveDesc") });
  if (isAdminEmail(ctx.user.email)) help.unshift({ href: "/admin", icon: Shield, title: "Admin", desc: "Usuários, assinaturas e números do Carretel." });

  // números rápidos do taller para o cartão de perfil
  const count = async (table: typeof batches | typeof clients | typeof workers) =>
    (await ctx.tdb.query((db, sc) => db.select({ n: sql<number>`count(*)::int` }).from(table).where(sc(table))))[0]?.n ?? 0;
  const [nBatches, nClients, nWorkers] = await Promise.all([count(batches), count(clients), count(workers)]);
  const showUpgrade = plan !== "active" && plan !== "trialing" && ctx.role === "owner";
  const stats: [string, number][] = [
    [t("batches"), nBatches],
    [t("clients"), nClients],
    [t("team"), nWorkers],
  ];

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("lead")} />

      <div className="lg:grid lg:grid-cols-[21rem_minmax(0,1fr)] lg:items-start lg:gap-8">
        {/* conta — celular: faixa horizontal; computador: cartão de perfil fixo */}
        <section aria-label={t("sectionAccount")} className="lg:sticky lg:top-24">
          <Link href="/cuenta" className="group flex flex-wrap items-center gap-4 rounded-[2rem] bg-mint-soft p-5 transition-shadow hover:shadow-soft sm:p-6 lg:hidden">
            <WorkshopAvatar name={ctx.workshop.name} mediaId={ctx.workshop.avatarMediaId} className="size-14 text-lg" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xl font-medium">{ctx.workshop.name}</span>
              <span className="mt-0.5 block truncate text-sm text-muted-foreground">{t("signedAs", { email: ctx.user.email })}</span>
              <span className="mt-2 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-card px-3 py-1 text-xs font-medium">
                <span className="size-1.5 rounded-full bg-vivid" aria-hidden="true" />
                {planLabel}
              </span>
            </span>
            <span className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-card px-4 text-sm font-medium shadow-soft sm:w-auto">
              <CreditCard aria-hidden="true" className="size-4" />
              {t("manage")}
              <ChevronRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          <div className="hidden space-y-4 lg:block">
            <div className="overflow-hidden rounded-[2rem] border border-ink/[0.06] bg-card shadow-soft">
              <div className="bg-mint-soft px-6 pb-6 pt-8 text-center">
                <WorkshopAvatar name={ctx.workshop.name} mediaId={ctx.workshop.avatarMediaId} className="mx-auto size-24 text-2xl ring-4 ring-card" />
                <p className="mt-4 truncate text-xl font-medium">{ctx.workshop.name}</p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{ctx.user.email}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-medium">
                  <span className="size-1.5 rounded-full bg-vivid" aria-hidden="true" />
                  {planLabel}
                </span>
              </div>
              <dl className="grid grid-cols-3 divide-x divide-ink/[0.06] border-y border-ink/[0.06]">
                {stats.map(([k, v]) => (
                  <div key={k} className="px-2 py-4 text-center">
                    <dd className="text-2xl font-light tabular-money">{v}</dd>
                    <dt className="mt-0.5 truncate text-xs text-muted-foreground">{k}</dt>
                  </div>
                ))}
              </dl>
              <div className="space-y-2 p-4">
                {showUpgrade ? (
                  <Link href="/assinar" className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85">
                    <Sparkles aria-hidden="true" className="size-4" />
                    {t("activatePlan")}
                  </Link>
                ) : null}
                <Link href="/cuenta" className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-ink/15 px-4 text-sm font-medium transition-colors hover:border-ink/40">
                  <CreditCard aria-hidden="true" className="size-4" />
                  {t("manage")}
                </Link>
                <p className="pt-1 text-center text-xs text-muted-foreground">{t("memberSince", { date: formatDate(ctx.workshop.createdAt, locale) })}</p>
              </div>
            </div>
            <InstallHint />
          </div>
        </section>

        <div className="mt-8 space-y-8 lg:mt-0">
          <Section title={t("sectionWorkshop")} entries={workshop} showPro={showUpgrade} />
          <Section title={t("sectionHelp")} entries={help} />
          <div className="grid gap-4 md:grid-cols-2 lg:hidden">
            <InstallHint />
            <div className="flex items-end">
              <SignOutButton mode={authMode()} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
