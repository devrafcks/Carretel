import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { authMode, devAuthAllowed } from "@/lib/auth/server";
import { currentUser } from "@/lib/session";
import { LoginForm } from "./login-form";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function EntrarPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; conta?: string }>;
}) {
  const { locale } = await params;
  const { next, conta } = await searchParams;
  setRequestLocale(locale);
  const user = await currentUser();
  if (user) redirect(`/${locale}/hoy`);
  const safeNext = next && /^\/(es|pt-BR)\/[a-z/-]*$/.test(next) ? next : `/${locale}/hoy`;
  return (
    <Card className="rounded-3xl p-6 sm:p-8">
      <LoginForm mode={authMode()} devAllowed={devAuthAllowed()} next={safeNext} initialTab={conta === "nova" ? "signup" : "login"} />
    </Card>
  );
}
