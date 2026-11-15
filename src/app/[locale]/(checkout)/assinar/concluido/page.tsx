import { getTranslations, setRequestLocale } from "next-intl/server";
import { CircleCheck, Clock, TriangleAlert, ArrowRight, CreditCard, QrCode } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import { currentUser, loadWorkshopContext } from "@/lib/session";
import { billingMode, reconcileSubscription } from "@/server/billing";
import { formatDate } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { brand } from "@/config/brand";
import { cyclePriceCents, isPriceTier } from "@/lib/pricing";
import { subscriptions } from "@/db/schema";
import { AutoRefresh } from "./auto-refresh";

export const dynamic = "force-dynamic";

/**
 * Para onde a AbacatePay devolve a pessoa depois do pagamento.
 * Confere o pagamento na hora (não depende do webhook) e mostra: pronto, confirmando ou não concluído.
 */
export default async function ConcluidoPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ t?: string }> }) {
  const { locale } = await params;
  const { t: triesRaw } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("subscribe");
  const tries = Math.min(10, Math.max(0, Number(triesRaw) || 0));

  const card = (children: React.ReactNode) => <div className="w-full max-w-lg rounded-[2rem] border border-ink/[0.06] bg-card p-6 text-center shadow-lift sm:p-8">{children}</div>;

  const user = await currentUser();
  if (!user) {
    return card(
      <>
        <Icon tone="ok">
          <CircleCheck aria-hidden="true" className="size-8" />
        </Icon>
        <h1 className="text-hero mt-5 text-3xl sm:text-4xl">{t("doneLoggedOutTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{t("doneLoggedOutBody")}</p>
        <Link href={`/entrar?next=${encodeURIComponent(`/${locale}/assinar/concluido`)}`} className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 font-medium text-primary-foreground hover:bg-primary/85">
          {t("doneLogin")}
          <ArrowRight aria-hidden="true" className="size-5" />
        </Link>
      </>,
    );
  }

  const ctx = await loadWorkshopContext();
  let status = ctx?.workshop.planStatus;
  let sub = ctx?.subscription ?? null;
  if (ctx && billingMode() === "abacatepay") {
    const changed = await reconcileSubscription(ctx, { force: true });
    if (changed) {
      // o contexto da requisição fica em cache: relê a assinatura atualizada
      status = changed;
      sub = (await ctx.tdb.first(subscriptions)) ?? null;
    }
  }

  // renovação do anual em aberto: o plano segue ativo, mas este pagamento ainda não foi confirmado
  if ((status === "active" || status === "trialing") && sub?.status !== "pending_checkout") {
    const trial = status === "trialing";
    const annual = sub?.billingCycle === "annual";
    const cents = cyclePriceCents(isPriceTier(sub?.priceTier) ? sub.priceTier : "founder", annual ? "annual" : "monthly", brand.pricing);
    const MethodIcon = sub?.method === "PIX" ? QrCode : CreditCard;
    const when = trial ? sub?.trialEndsAt ?? sub?.currentPeriodEnd : sub?.currentPeriodEnd;
    return card(
      <>
        <Icon tone="ok">
          <CircleCheck aria-hidden="true" className="size-8" />
        </Icon>
        <h1 className="text-hero mt-5 text-4xl">{t("doneTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{trial ? t("doneTrialBody", { date: when ? formatDate(when, locale) : "—" }) : t("doneActiveBody")}</p>
        <dl className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-mint-50 p-4 text-left text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">{t("donePlan")}</dt>
            <dd className="font-medium">{annual ? t("planNameAnnual") : t("planName")}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{t("doneMethod")}</dt>
            <dd className="inline-flex items-center gap-1.5 font-medium">
              <MethodIcon aria-hidden="true" className="size-4" />
              {sub?.method === "PIX" ? (annual ? t("pixAnnualTitle") : t("pixTitle")) : t("cardTitle")}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{t("doneValue")}</dt>
            <dd className="font-medium tabular-money">
              {formatBRL(cents, locale)}
              {annual ? t("perYear") : t("perMonth")}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">{trial ? t("doneFirstCharge") : annual ? t("doneValidUntil") : t("doneNextCharge")}</dt>
            <dd className="font-medium">{when ? formatDate(trial || annual ? when : new Date(when.getTime() - 3 * 86_400_000), locale, annual ? { year: "numeric" } : {}) : "—"}</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/hoy" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 font-medium text-primary-foreground hover:bg-primary/85">
            {t("goPanel")}
            <ArrowRight aria-hidden="true" className="size-5" />
          </Link>
          <Link href="/cuenta" className="inline-flex min-h-12 items-center justify-center rounded-full border border-ink/15 px-6 font-medium hover:border-ink/40">
            {t("goAccount")}
          </Link>
        </div>
      </>,
    );
  }

  // ainda sem confirmação: a AbacatePay pode levar alguns segundos; a página confere de novo sozinha
  if (status === "pending_checkout" || sub?.status === "pending_checkout") {
    const giveUp = tries >= 10;
    return card(
      <>
        <Icon tone="wait">
          <Clock aria-hidden="true" className="size-8" />
        </Icon>
        <h1 className="text-hero mt-5 text-3xl sm:text-4xl">{giveUp ? t("doneSlowTitle") : t("doneWaitingTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{giveUp ? t("doneSlowBody") : t("doneWaitingBody")}</p>
        {!giveUp ? <AutoRefresh tries={tries} label={t("doneChecking")} /> : null}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a href={`/${locale}/assinar/concluido?t=${tries + 1}`} className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 font-medium text-primary-foreground hover:bg-primary/85">
            {t("doneCheckNow")}
          </a>
          <Link href="/assinar" className="inline-flex min-h-12 items-center justify-center rounded-full border border-ink/15 px-6 font-medium hover:border-ink/40">
            {t("doneTryAgain")}
          </Link>
        </div>
      </>,
    );
  }

  return card(
    <>
      <Icon tone="warn">
        <TriangleAlert aria-hidden="true" className="size-8" />
      </Icon>
      <h1 className="text-hero mt-5 text-3xl sm:text-4xl">{t("doneFailedTitle")}</h1>
      <p className="mt-2 text-muted-foreground">{t("doneFailedBody")}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/assinar" className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 font-medium text-primary-foreground hover:bg-primary/85">
          {t("doneTryAgain")}
        </Link>
        <Link href="/hoy" className="inline-flex min-h-12 items-center justify-center rounded-full border border-ink/15 px-6 font-medium hover:border-ink/40">
          {t("goPanel")}
        </Link>
      </div>
    </>,
  );
}

function Icon({ tone, children }: { tone: "ok" | "wait" | "warn"; children: React.ReactNode }) {
  const cls = tone === "ok" ? "bg-mint-100 text-vivid-strong" : tone === "wait" ? "bg-awaiting-confirmation-bg text-awaiting-confirmation-fg" : "bg-overdue-calote-bg text-overdue-calote-fg";
  return <span className={`mx-auto inline-flex size-16 items-center justify-center rounded-full ${cls}`}>{children}</span>;
}
