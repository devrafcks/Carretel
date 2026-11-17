import { setRequestLocale } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { ResetPasswordForm } from "./reset-form";
import { emailEnabled } from "@/lib/auth/email";
import { legal } from "@/config/legal";

export const dynamic = "force-dynamic";

/** "Esqueci minha senha": código de 6 números por e-mail (se houver SMTP) ou passado pelo suporte (gerado no /admin). */
export default async function EsqueciSenhaPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ email?: string; codigo?: string }> }) {
  const { locale } = await params;
  const { email, codigo } = await searchParams;
  setRequestLocale(locale);
  return (
    <Card className="rounded-3xl p-6 sm:p-8">
      <ResetPasswordForm initialEmail={email && email.length < 200 ? email : ""} startAtCode={codigo === "1" && Boolean(email)} emailEnabled={emailEnabled()} supportEmail={legal.supportEmail} />
    </Card>
  );
}
