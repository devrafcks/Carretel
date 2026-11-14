import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/app/legal-page";
import { privacy, terms } from "@/content/legal";
import { legal } from "@/config/legal";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage version={legal.documentVersions.privacy} doc={privacy[locale === "es" ? "es" : "pt-BR"]} related={{ href: "/terminos", label: terms[locale === "es" ? "es" : "pt-BR"].title }} />;
}
