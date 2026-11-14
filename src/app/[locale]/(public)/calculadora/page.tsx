import { getTranslations, setRequestLocale } from "next-intl/server";
import { loadWorkshopContext } from "@/lib/session";
import { workshopSettings } from "@/db/schema";
import { Calculator } from "./calculator-client";
import { PageHeader } from "@/components/app/page-header";

export const dynamic = "force-dynamic";

export default async function CalculadoraPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("calc");
  const ctx = await loadWorkshopContext();
  const settings = ctx ? await ctx.tdb.first(workshopSettings) : undefined;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader tone="sun" illustration="/illustrations/calculadora.svg" kicker={t("offer")} title={t("title")} subtitle={t("lead")} />
      <Calculator loggedIn={Boolean(ctx)} profile={settings?.calculatorProfile ?? null} />
    </div>
  );
}
