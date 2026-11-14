import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireWorkshop } from "@/lib/session";
import { workshopSettings } from "@/db/schema";
import { PageHeader } from "@/components/app/page-header";
import { Card, Notice } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/dates";
import { brand } from "@/config/brand";
import { legal, legalValue } from "@/config/legal";
import { withinRefundWindow } from "@/lib/subscription";
import { billingMode } from "@/server/billing";
import { Paywall, CancelSubscription, WorkshopForm, PixForm, SettingsForm, DangerZone } from "./account-client";
import { Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default async function CuentaPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ checkout?: string }> }) {
  const { locale } = await params;
  const { checkout } = await searchParams;
  setRequestLocale(locale);
  const ctx = await requireWorkshop();
  const t = await getTranslations();
  const ws = ctx.workshop;
  const sub = ctx.subscription;
  const settings = await ctx.tdb.first(workshopSettings);
  const status = ws.planStatus;
  const periodEnd = sub?.currentPeriodEnd ? formatDate(sub.currentPeriodEnd, locale) : "—";
  const tone = status === "active" || status === "trialing" ? "paid" : status === "read_only" || status === "past_due" ? "overdue-calote" : status === "canceled" ? "neutral" : "awaiting-confirmation";

  let statusText: string;
  switch (status) {
    case "active":
      statusText = t("account.active", { date: periodEnd });
      break;
    case "trialing":
      statusText = t("account.trialing", { date: sub?.trialEndsAt ? formatDate(sub.trialEndsAt, locale) : "—" });
      break;
    case "past_due":
      statusText = t("account.pastDue");
      break;
    case "canceled":
      statusText = t("account.canceled", { date: periodEnd });
      break;
    case "read_only":
      statusText = t("account.readOnly");
      break;
    case "pending_checkout":
      statusText = t("account.pending");
      break;
    default:
      statusText = t("account.freeUsage", { used: Math.min(ws.freeBatchesUsed, brand.freeBatchLimit), limit: brand.freeBatchLimit });
  }
  const showPaywall = status === "free" || status === "pending_checkout" || status === "read_only" || status === "canceled" || status === "past_due";
  const canCancel = status === "active" || status === "trialing" || status === "past_due";

  return (
    <div className="space-y-5">
      <PageHeader tone="ink" illustration="/illustrations/hero.svg" kicker={t(`status.plan.${status}`)} title={ws.name} subtitle={t("account.title")} backHref="/mas" backLabel={t("common.back")} />

      <Card className="p-4" id="plan">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg">{t("account.subscription")}</h2>
          <StatusBadge tone={tone} label={t(`status.plan.${status}`)} />
        </div>
        <p className="mt-2 text-lg font-semibold tabular-money">{statusText}</p>
        {checkout === "cancel" ? (
          <Notice tone="danger" className="mt-3" role="alert">
            <p>{t("account.checkoutFailed")}</p>
          </Notice>
        ) : null}
        {showPaywall ? <Paywall mode={billingMode()} /> : null}
        {canCancel ? <CancelSubscription refundEligible={withinRefundWindow(sub?.firstChargedAt)} /> : null}
      </Card>

      <Card className="p-4">
        <h2 className="font-display text-lg">{t("account.workshopData")}</h2>
        <WorkshopForm
          ws={{ name: ws.name, district: ws.district ?? "", city: ws.city ?? "", machineCount: ws.machineCount, phone: ws.phoneE164 ?? "", docType: ws.docType ?? "", docLast3: ws.docLast3 }}
        />
      </Card>

      <Card className="p-4">
        <h2 className="font-display text-lg">{t("account.pix")}</h2>
        <p className="mt-1">{t("account.pixWarning")}</p>
        {!ws.pixKey ? (
          <Notice tone="warning" className="mt-3">
            <p>{t("account.pixMissing")}</p>
          </Notice>
        ) : null}
        <PixForm pix={{ type: ws.pixKeyType ?? "evp", key: ws.pixKey ?? "", name: ws.pixMerchantName ?? ws.name.slice(0, 25), city: ws.pixCity ?? "Sao Paulo" }} />
      </Card>

      <Card className="p-4">
        <h2 className="font-display text-lg">{t("account.settings")}</h2>
        <SettingsForm period={settings?.settlementPeriod ?? "weekly"} maxHours={settings?.maxHoursPerDay ?? ""} />
      </Card>

      <Card className="p-4">
        <h2 className="font-display text-lg">{t("account.data")}</h2>
        <a href="/api/export" className={buttonVariants({ variant: "outline", block: true, className: "mt-3" })} download>
          <Download aria-hidden="true" /> {t("account.export")}
        </a>
        <DangerZone workshopName={ws.name} />
      </Card>

      <Card className="p-4">
        <h2 className="font-display text-lg">{t("account.legal")}</h2>
        <dl className="mt-2 space-y-1">
          <div className="flex gap-2">
            <dt className="font-semibold">{t("legal.company")}:</dt>
            <dd>{legalValue(legal.companyName)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold">{t("legal.cnpj")}:</dt>
            <dd>{legalValue(legal.cnpj)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold">{t("legal.email")}:</dt>
            <dd>{legalValue(legal.supportEmail)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold">{t("legal.dpo")}:</dt>
            <dd>
              {legalValue(legal.dpoName)} {legal.dpoEmail ? `· ${legal.dpoEmail}` : ""}
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
