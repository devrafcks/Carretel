import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireWorkshop } from "@/lib/session";
import { workshopSettings } from "@/db/schema";
import { Calculator } from "./calculator-client";
import { PageHeader } from "@/components/app/page-header";

export const dynamic = "force-dynamic";

/** Calculadora: só com conta (o proxy manda quem não está logado para "Criar conta"). */
export default async function CalculadoraPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("calc");
  const ctx = await requireWorkshop();
  const settings = await ctx.tdb.first(workshopSettings);
  return (
    <>
      <PageHeader kicker={t("offer")} title={t("title")} subtitle={t("lead")} />
      <Calculator loggedIn profile={settings?.calculatorProfile ?? null} />
    </>
  );
}
