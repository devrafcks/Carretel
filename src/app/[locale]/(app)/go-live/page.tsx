import { getTranslations, setRequestLocale } from "next-intl/server";
import { CircleCheck, CircleX } from "@/components/icons";
import { requireWorkshop } from "@/lib/session";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { missingLegalFields } from "@/config/legal";
import { dbMode } from "@/db/mode";
import { authMode } from "@/lib/auth/server";
import { billingMode } from "@/server/billing";
import { currentLegalParam } from "@/db/public";
import { todayISO } from "@/lib/dates";

/** Página interna: o que falta antes do go-live (seção 7.5 da pesquisa). */
export default async function GoLivePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireWorkshop();
  const t = await getTranslations("golive");
  const missing = missingLegalFields();
  const minWage = await currentLegalParam("minimum_wage_monthly_cents", todayISO());
  const services: [string, boolean, string][] = [
    [t("db"), dbMode() === "neon", dbMode() === "neon" ? "Supabase (Postgres)" : t("local")],
    [t("auth"), authMode() === "neon", authMode() === "neon" ? "Better Auth" : t("local")],
    [t("billing"), billingMode() === "abacatepay", billingMode() === "abacatepay" ? "AbacatePay" : t("simulated")],
    [t("minWage"), Boolean(minWage), minWage ? `${minWage.valueCents} (${minWage.validFrom})` : t("missing")],
    ["DATA_ENCRYPTION_KEY", Boolean(process.env.DATA_ENCRYPTION_KEY), process.env.DATA_ENCRYPTION_KEY ? t("ok") : t("missing")],
    ["CRON_SECRET", Boolean(process.env.CRON_SECRET), process.env.CRON_SECRET ? t("ok") : t("missing")],
    ["NEXT_PUBLIC_APP_URL", Boolean(process.env.NEXT_PUBLIC_APP_URL), process.env.NEXT_PUBLIC_APP_URL ?? t("missing")],
  ];
  return (
    <div className="space-y-5">
      <PageHeader tone="sun" illustration="/illustrations/calculadora.svg" title={t("title")} subtitle={t("lead")} backHref="/mas" />
      <Card className="p-4">
        <h2 className="font-display text-lg">{t("envTitle")}</h2>
        <ul className="mt-3 space-y-2">
          {services.map(([label, ok, detail]) => (
            <li key={label} className="flex items-center gap-3">
              {ok ? <CircleCheck aria-hidden="true" className="size-5 text-paid-fg" /> : <CircleX aria-hidden="true" className="size-5 text-overdue-calote-fg" />}
              <span className="flex-1 font-semibold">{label}</span>
              <span className="font-mono text-sm">{detail}</span>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="p-4">
        <h2 className="font-display text-lg">{t("legalMissing")}</h2>
        {missing.length ? (
          <ul className="mt-3 list-disc space-y-1 pl-5">
            {missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-paid-fg">{t("ok")}</p>
        )}
      </Card>
      <Card className="p-4">
        <ul className="list-disc space-y-1 pl-5">
          <li>A1 nome comercial (Carretel — verificar INPI e domínio)</li>
          <li>A5 domínio .com.br + HTTPS</li>
          <li>AbacatePay: Pix Automático + Assinaturas liberados (inclusive Modo Teste), produto R$ 35 MONTHLY, webhook</li>
          <li>D3 validação dos termos de costura com 3–5 oficinas</li>
          <li>D5 revisão jurídica e contábil (termos, privacidade, recibo, alertas CLT)</li>
          <li>D6 licença do widget de acessibilidade (auto-hospedagem com SRI)</li>
          <li>D7 salário mínimo vigente em legal_params (com fonte)</li>
          <li>Neon Auth: SMTP próprio para produção</li>
          <li>Vercel em plano compatível com uso comercial</li>
        </ul>
      </Card>
    </div>
  );
}
