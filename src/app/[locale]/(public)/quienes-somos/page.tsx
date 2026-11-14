import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/app/legal-page";
import { about } from "@/content/legal";


export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage doc={about[locale === "es" ? "es" : "pt-BR"]} />;
}
