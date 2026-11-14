import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireWorkshop } from "@/lib/session";
import { billingMode } from "@/server/billing";
import { PageHeader } from "@/components/app/page-header";
import { Notice } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { SimulatedCheckout } from "../account-client";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";

export default async function PagoSimuladoPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ method?: string }> }) {
  const { locale } = await params;
  const { method } = await searchParams;
  setRequestLocale(locale);
  if (billingMode() !== "simulated") notFound();
  const ctx = await requireWorkshop();
  const t = await getTranslations();
  return (
    <div className="space-y-4">
      <PageHeader title={t("account.simulatedTitle")} backHref="/cuenta" backLabel={t("common.back")} />
      <Notice tone="info">
        <p>{t("account.simulatedLead")}</p>
      </Notice>
      <p className="flex items-center gap-2">
        <StatusBadge tone="neutral" label={t(`status.plan.${ctx.workshop.planStatus}`)} />
        <span className="font-mono text-sm">{method === "CARD" ? "CARD" : "PIX"}</span>
      </p>
      <SimulatedCheckout method={method === "CARD" ? "CARD" : "PIX"} />
      <Link href="/cuenta" className={buttonVariants({ variant: "ghost", block: true })}>
        {t("account.goBack")}
      </Link>
    </div>
  );
}
