import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/app/legal-page";
import { terms } from "@/content/legal";
import { legal } from "@/config/legal";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage version={legal.documentVersions.terms} doc={terms[locale === "es" ? "es" : "pt-BR"]} />;
}
