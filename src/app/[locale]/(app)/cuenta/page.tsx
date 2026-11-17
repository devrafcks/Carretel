import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireWorkshop } from "@/lib/session";
import { workshopSettings } from "@/db/schema";
import { PageHeader } from "@/components/app/page-header";
import { Card, Notice } from "@/components/ui/card";
import { brand } from "@/config/brand";
import { billingMode, canRenewAnnual, reconcileSubscription } from "@/server/billing";
import { cyclePriceCents, isPriceTier } from "@/lib/pricing";
import { redirect } from "next/navigation";
import { CircleCheck, Clock } from "@/components/icons";
import { WorkshopForm, PixForm, SettingsForm, DangerZone } from "./account-client";
import { Download } from "@/components/icons";
import { AvatarEditor } from "@/components/app/avatar-editor";
import { SubscriptionCard } from "./subscription-card";
import { buttonVariants } from "@/components/ui/button";

export default async function CuentaPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ checkout?: string }> }) {
  const { locale } = await params;
  const { checkout } = await searchParams;
  setRequestLocale(locale);
  const ctx = await requireWorkshop();
  const t = await getTranslations();
  if (checkout === "ok") redirect(`/${locale}/assinar/concluido`);
  // confere com a AbacatePay (cancelamento pelo portal etc.) — funciona mesmo sem webhook
  if (ctx.subscription && billingMode() === "abacatepay") {
    const next = await reconcileSubscription(ctx);
    if (next && next !== ctx.workshop.planStatus) redirect(`/${locale}/cuenta?checkout=${checkout === "ok" ? "done" : "sync"}`);
  }
  const ws = ctx.workshop;
  const sub = ctx.subscription;
  const settings = await ctx.tdb.first(workshopSettings);
  const status = ws.planStatus;
  // assinaturas antigas sem faixa gravada entraram a R$ 35 (a migração 0005 marca como fundador)
  const tier = isPriceTier(sub?.priceTier) ? sub.priceTier : "founder";
  const cycle = sub?.billingCycle === "annual" ? "annual" : "monthly";
  return (
    <div className="space-y-5">
      <PageHeader tone="ink" illustration="/illustrations/hero.svg" kicker={t(`status.plan.${status}`)} title={ws.name} subtitle={t("account.title")} backHref="/mas" backLabel={t("common.back")} />

      <Card className="p-6">
        <AvatarEditor name={ws.name} mediaId={ws.avatarMediaId} />
      </Card>

      <SubscriptionCard
        locale={locale}
        status={status}
        sub={sub}
        priceCents={cyclePriceCents(tier, cycle, brand.pricing)}
        cycle={cycle}
        tier={tier}
        renewOpen={canRenewAnnual(status, sub)}
        renewWindowDays={brand.pricing.annualRenewWindowDays}
        freeUsed={ws.freeBatchesUsed}
        freeLimit={brand.freeBatchLimit}
        refundUntil={sub?.firstChargedAt ? new Date(sub.firstChargedAt.getTime() + 7 * 86_400_000) : null}
        billingEnabled={billingMode() !== "disabled"}
      >
        {(checkout === "done" || checkout === "ok") && (status === "active" || status === "trialing") ? (
          <Notice tone="success" className="mt-3" icon={<CircleCheck />} role="status">
            <p className="font-medium">{t("account.checkoutDone")}</p>
          </Notice>
        ) : null}
        {checkout === "ok" && status === "pending_checkout" ? (
          <Notice tone="info" className="mt-3" icon={<Clock />} role="status">
            <p>
              {t("account.checkoutConfirming")}{" "}
              <a href={`/${locale}/cuenta?checkout=ok`} className="font-medium underline underline-offset-4">
                {t("account.refreshNow")}
              </a>
            </p>
          </Notice>
        ) : null}
        {checkout === "cancel" ? (
          <Notice tone="danger" className="mt-3" role="alert">
            <p>{t("account.checkoutFailed")}</p>
          </Notice>
        ) : null}
      </SubscriptionCard>

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
    </div>
  );
}
