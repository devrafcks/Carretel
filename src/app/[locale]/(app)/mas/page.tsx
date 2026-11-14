import { getTranslations, setRequestLocale } from "next-intl/server";
import { Calculator, Users, Team, CreditCard, Accessibility, Shield, FileText, Info, ListChecks, ChevronRight, Package, type AppIcon } from "@/components/icons";
import { requireWorkshop } from "@/lib/session";
import { PageHeader } from "@/components/app/page-header";
import { Link } from "@/i18n/navigation";
import { InstallHint } from "@/components/app/install-hint";
import { SignOutButton } from "./sign-out";
import { authMode } from "@/lib/auth/server";
import { initials } from "@/lib/utils";

type Entry = { href: string; icon: AppIcon; title: string; desc: string };

function Section({ title, entries }: { title: string; entries: Entry[] }) {
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
                <span className="block font-medium">{e.title}</span>
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
  ];
  const help: Entry[] = [
    { href: "/accesibilidad", icon: Accessibility, title: t("a11y"), desc: t("a11yDesc") },
    { href: "/privacidad", icon: Shield, title: t("privacy"), desc: t("privacyDesc") },
    { href: "/terminos", icon: FileText, title: t("terms"), desc: t("termsDesc") },
    { href: "/quienes-somos", icon: Info, title: t("about"), desc: t("aboutDesc") },
  ];
  if (process.env.NODE_ENV !== "production") help.push({ href: "/go-live", icon: ListChecks, title: t("golive"), desc: t("goliveDesc") });

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("lead")} />

      {/* conta */}
      <section aria-label={t("sectionAccount")}>
        <Link
          href="/cuenta"
          className="group flex flex-wrap items-center gap-4 rounded-[2rem] bg-mint-soft p-5 transition-shadow hover:shadow-soft sm:p-6"
        >
          <span aria-hidden="true" className="inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-medium text-primary-foreground">
            {initials(ctx.workshop.name)}
          </span>
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
      </section>

      <Section title={t("sectionWorkshop")} entries={workshop} />
      <Section title={t("sectionHelp")} entries={help} />

      <div className="grid gap-4 md:grid-cols-2">
        <InstallHint />
        <div className="flex items-end">
          <SignOutButton mode={authMode()} />
        </div>
      </div>
    </div>
  );
}
