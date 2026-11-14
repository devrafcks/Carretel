import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { authMode, devAuthAllowed } from "@/lib/auth/server";
import { currentUser } from "@/lib/session";
import { LoginForm } from "./login-form";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function EntrarPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string }> }) {
  const { locale } = await params;
  const { next } = await searchParams;
  setRequestLocale(locale);
  const user = await currentUser();
  if (user) redirect(`/${locale}/hoy`);
  const t = await getTranslations("auth");
  const safeNext = next && /^\/(es|pt-BR)\/[a-z/-]*$/.test(next) ? next : `/${locale}/hoy`;
  return (
    <Card className="rounded-3xl p-6 sm:p-8">
      <h1 className="font-display text-3xl font-extrabold">{t("title")}</h1>
      <p className="mt-1">{t("lead")}</p>
      <LoginForm mode={authMode()} devAllowed={devAuthAllowed()} next={safeNext} />
    </Card>
  );
}
