import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { TriangleAlert } from "@/components/icons";
import type { WorkshopContext } from "@/lib/session";
import { TopBar } from "@/components/app/top-bar";
import { BottomNav, SideRail } from "@/components/app/bottom-nav";
import { OfflineProvider } from "@/components/app/offline-provider";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { authMode } from "@/lib/auth/server";
import { isAdminEmail } from "@/lib/admin";
import { needsReconcile, pricingOffer, reconcileSubscription } from "@/server/billing";
import { formatBRL } from "@/lib/money";

/** Moldura do painel: sidebar à esquerda (computador), barra de cima e navegação inferior (celular). Conteúdo em largura total. */
export async function AppShell({ ctx, children }: { ctx: WorkshopContext; children: React.ReactNode }) {
  const t = await getTranslations("common");
  const locale = await getLocale();
  // teste que acabou / checkout em aberto: confere com a AbacatePay (no máx. 1x a cada 30 s por taller)
  if (needsReconcile(ctx.workshop, ctx.subscription)) await reconcileSubscription(ctx).catch(() => null);
  const limited = !ctx.access.canCreateBatch;
  const showUpgrade = ctx.workshop.planStatus !== "active" && ctx.workshop.planStatus !== "trialing" && ctx.role === "owner";
  // preço do mensal para esta oficina (fundador enquanto houver vaga, ou o que ela já paga)
  const upgradePrice = showUpgrade ? formatBRL((await pricingOffer(ctx.subscription, ctx.workshop.id, { cached: true, planStatus: ctx.workshop.planStatus })).monthlyCents, locale) : undefined;
  return (
    <OfflineProvider workshopId={ctx.workshop.id}>
      <div className="flex min-h-dvh">
        {/* espaço da sidebar fixa no computador */}
        <div aria-hidden="true" className="hidden w-64 shrink-0 lg:block" />
        <Suspense fallback={null}>
          <SideRail workshopName={ctx.workshop.name} avatarMediaId={ctx.workshop.avatarMediaId} authMode={authMode()} showUpgrade={showUpgrade} upgradePrice={upgradePrice} showAdmin={isAdminEmail(ctx.user.email)} />
        </Suspense>
        <div className="min-w-0 flex-1">
          <TopBar workshopName={ctx.workshop.name} showUpgrade={showUpgrade} upgradePrice={upgradePrice} />
          {limited ? (
            <div role="status" className="w-full px-4 pt-4 sm:px-6 lg:px-10">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-mint-200 bg-mint-50 px-4 py-3 text-foreground">
                <TriangleAlert aria-hidden="true" className="size-5 shrink-0 text-vivid-strong" />
                <p className="min-w-0 flex-1">{ctx.access.reason === "free_exhausted" ? t("errorFreeExhausted") : t("errorReadOnly")}</p>
                <Link href="/assinar" className={buttonVariants({ size: "sm" })}>
                  {ctx.access.reason === "free_exhausted" ? t("activatePlan") : t("renew")}
                </Link>
              </div>
            </div>
          ) : null}
          <main id="conteudo" className="w-full px-4 pb-32 pt-6 sm:px-6 lg:px-10 lg:pb-16">
            {children}
          </main>
        </div>
      </div>
      <BottomNav />
    </OfflineProvider>
  );
}
