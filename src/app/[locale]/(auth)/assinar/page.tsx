import { getTranslations, setRequestLocale } from "next-intl/server";
import { CircleCheck } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { currentUser, loadWorkshopContext } from "@/lib/session";
import { authMode, devAuthAllowed } from "@/lib/auth/server";
import { billingIsTestMode, billingMode, pixAutomaticoAvailable } from "@/server/billing";
import { brand } from "@/config/brand";
import { SubscribeFlow } from "./subscribe-flow";

export const dynamic = "force-dynamic";

/**
 * Fluxo de assinatura em passos. O servidor decide onde a pessoa está:
 * sem sessão → passo "Conta" (entrar ou criar ali mesmo); sem taller → passo "Taller"; senão → "Pagamento".
 * O botão de upgrade do painel cai aqui já logado, então começa direto no pagamento.
 */
export default async function AssinarPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("subscribe");
  const user = await currentUser();
  const ctx = user ? await loadWorkshopContext() : null;
  const plan = ctx?.workshop.planStatus;

  if (plan === "active" || plan === "trialing") {
    return (
      <Card className="rounded-3xl p-6 text-center sm:p-8">
        <span className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-mint-100 text-vivid-strong">
          <CircleCheck aria-hidden="true" className="size-7" />
        </span>
        <h1 className="text-hero mt-4 text-4xl">{t("alreadyTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{t("alreadyBody")}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/hoy" className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 font-medium text-primary-foreground hover:bg-primary/85">
            {t("goPanel")}
          </Link>
          <Link href="/cuenta" className="inline-flex min-h-12 items-center justify-center rounded-full border border-ink/15 px-6 font-medium hover:border-ink/40">
            {t("goAccount")}
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <SubscribeFlow
      locale={locale}
      loggedIn={Boolean(user)}
      email={user?.email ?? null}
      workshopName={ctx?.workshop.name ?? null}
      authMode={authMode()}
      devAllowed={devAuthAllowed()}
      billing={billingMode()}
      testMode={billingIsTestMode()}
      pixAvailable={pixAutomaticoAvailable()}
      trialDays={brand.cardTrialDays}
      priceCents={brand.planPriceCents}
    />
  );
}
