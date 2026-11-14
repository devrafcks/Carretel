import { setRequestLocale } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { ResetPasswordForm } from "./reset-form";

export const dynamic = "force-dynamic";

/** "Esqueci minha senha": código de 6 números pelo e-mail do próprio Neon Auth (sem provedor pago). */
export default async function EsqueciSenhaPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ email?: string }> }) {
  const { locale } = await params;
  const { email } = await searchParams;
  setRequestLocale(locale);
  return (
    <Card className="rounded-3xl p-6 sm:p-8">
      <ResetPasswordForm initialEmail={email && email.length < 200 ? email : ""} />
    </Card>
  );
}
