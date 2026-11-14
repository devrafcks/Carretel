import { getTranslations, setRequestLocale } from "next-intl/server";
import { Calculator, Users, Scissors, CreditCard, Accessibility, Shield, FileText, Info, ListChecks, ChevronRight, Package } from "@/components/icons";
import { requireWorkshop } from "@/lib/session";
import { PageHeader } from "@/components/app/page-header";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/app/theme";
import { InstallHint } from "@/components/app/install-hint";
import { SignOutButton } from "./sign-out";
import { authMode } from "@/lib/auth/server";

export default async function MasPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireWorkshop();
  const t = await getTranslations();
  const groups = [
    [
      ["/calculadora", Calculator, t("more.calculator")],
      ["/lotes", Package, t("more.batches")],
      ["/clientes", Users, t("more.clients")],
      ["/produccion?tab=equipo", Scissors, t("more.team")],
      ["/cuenta", CreditCard, t("more.account")],
    ],
    [
      ["/accesibilidad", Accessibility, t("more.a11y")],
      ["/privacidad", Shield, t("more.privacy")],
      ["/terminos", FileText, t("more.terms")],
      ["/quienes-somos", Info, t("more.about")],
      ["/go-live", ListChecks, t("more.golive")],
    ],
  ] as const;
  return (
    <div className="space-y-5">
      <PageHeader tone="indigo" illustration="/illustrations/hero.svg" title={t("more.title")} />
      {groups.map((g, i) => (
        <ul key={i} className="anim-rise delay-1 divide-y divide-border overflow-hidden rounded-2xl border border-ink/10 bg-card shadow-soft">
          {g.map(([href, Icon, label]) => (
            <li key={href}>
              <Link href={href} className="flex min-h-14 items-center gap-3 px-4 hover:bg-muted">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-mint-100 text-vivid-strong"><Icon aria-hidden="true" className="size-5" /></span>
                <span className="flex-1 font-semibold">{label}</span>
                <ChevronRight aria-hidden="true" className="size-5 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      ))}
      <Card className="p-4">
        <h2 className="font-display text-lg">{t("more.theme")}</h2>
        <ThemeToggle className="mt-3" />
      </Card>
      <InstallHint />
      <SignOutButton mode={authMode()} />
    </div>
  );
}
