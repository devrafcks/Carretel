import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { requireUser, loadWorkshopContext } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { OnboardingForm } from "./onboarding-form";

export const dynamic = "force-dynamic";

export default async function BienvenidaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireUser();
  if (await loadWorkshopContext()) redirect(`/${locale}/hoy`);
  const t = await getTranslations("onboarding");
  return (
    <Card className="rounded-3xl p-6 sm:p-8">
      <h1 className="text-hero text-4xl">{t("title")}</h1>
      <p className="mt-1">{t("lead")}</p>
      <OnboardingForm />
    </Card>
  );
}
