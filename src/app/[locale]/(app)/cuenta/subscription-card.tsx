import { getTranslations } from "next-intl/server";
import { TriangleAlert as AlertCircle, CircleCheck, Clock, CreditCard, QrCode, ShieldCheck, Sparkles, type AppIcon } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import type { PlanStatus } from "@/db/schema";
import type { Subscription } from "@/lib/session";
import { formatBRL } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { brand } from "@/config/brand";
import { CancelSubscription } from "./account-client";

const TONE: Record<PlanStatus, { pill: string; icon: AppIcon }> = {
  free: { pill: "bg-mint-50 text-foreground", icon: Sparkles },
  pending_checkout: { pill: "bg-awaiting-confirmation-bg text-awaiting-confirmation-fg", icon: Clock },
  trialing: { pill: "bg-mint-100 text-vivid-strong", icon: Sparkles },
  active: { pill: "bg-mint-100 text-vivid-strong", icon: CircleCheck },
  past_due: { pill: "bg-overdue-calote-bg text-overdue-calote-fg", icon: AlertCircle },
  canceled: { pill: "bg-ink/[0.06] text-foreground", icon: Clock },
  read_only: { pill: "bg-overdue-calote-bg text-overdue-calote-fg", icon: AlertCircle },
};

/** Hora atual fora do render (o lint não deixa chamar Date.now() direto no componente). */
function currentTime(): number {
  return Date.now();
}

/** Cartão "Seu plano": resumo do estado, detalhes da assinatura e a ação certa para cada caso. */
export async function SubscriptionCard({
  locale,
  status,
  sub,
  priceCents,
  cycle,
  tier,
  renewOpen,
  renewWindowDays,
  freeUsed,
  freeLimit,
  refundUntil,
  billingEnabled,
  children,
}: {
  locale: string;
  status: PlanStatus;
  sub: Subscription | null;
  /** valor do ciclo: por mês no mensal, o ano inteiro no anual */
  priceCents: number;
  cycle: "monthly" | "annual";
  tier: "founder" | "standard";
  /** anual perto do fim: libera "Renovar" */
  renewOpen: boolean;
  renewWindowDays: number;
  freeUsed: number;
  freeLimit: number;
  refundUntil: Date | null;
  billingEnabled: boolean;
  children?: React.ReactNode;
}) {
  const t = await getTranslations("plan");
  // o anual dura 12 meses: sem o ano, "15/11" seria ambíguo
  const d = (x: Date | null | undefined) => (x ? formatDate(x, locale, cycle === "annual" ? { year: "numeric" } : {}) : "—");
  const now = currentTime();
  const trialEnd = sub?.trialEndsAt ?? null;
  // o fim do período guarda 3 dias de folga para a cobrança cair; a próxima cobrança é 3 dias antes
  const accessEnd = sub?.currentPeriodEnd ?? null;
  const annual = cycle === "annual";
  // o anual não tem cobrança automática nem folga: a data é o fim do acesso
  const periodEnd = accessEnd && status === "active" && !annual ? new Date(accessEnd.getTime() - 3 * 86_400_000) : accessEnd;
  // acesso liberado pelo admin: plano ativo sem assinatura no AbacatePay (nada é cobrado)
  const complimentary = (status === "active" || status === "trialing") && !sub?.abacateSubscriptionId;
  const subscribed = !complimentary && (status === "trialing" || status === "active" || status === "past_due" || status === "canceled");

  const headline = complimentary
    ? t("headlineComplimentary")
    : status === "free"
      ? t("headline.free", { used: Math.min(freeUsed, freeLimit), limit: freeLimit })
      : status === "trialing"
        ? t("headline.trialing", { date: d(trialEnd ?? periodEnd) })
        : status === "active"
          ? annual
            ? t("headlineActiveAnnual", { date: d(periodEnd) })
            : t("headline.active", { date: d(periodEnd) })
          : status === "canceled"
            ? t("headline.canceled", { date: d(periodEnd) })
            : t(`headline.${status}`);

  // barra de progresso: dias do teste ou do ciclo atual
  let progress: { pct: number; daysLeft: number } | null = null;
  const end = status === "trialing" ? (trialEnd ?? periodEnd) : status === "active" || status === "canceled" ? periodEnd : null;
  if (end && !complimentary) {
    const total = status === "trialing" ? 7 * 86_400_000 : annual ? 366 * 86_400_000 : 31 * 86_400_000;
    const left = Math.max(0, end.getTime() - now);
    progress = { pct: Math.min(100, Math.max(4, 100 - (left / total) * 100)), daysLeft: Math.ceil(left / 86_400_000) };
  }
  if (status === "free") progress = { pct: Math.min(100, (Math.min(freeUsed, freeLimit) / freeLimit) * 100), daysLeft: -1 };

  const MethodIcon = sub?.method === "PIX" ? QrCode : CreditCard;
  const Tone = TONE[status];
  const details: [string, string][] = complimentary
    ? [
        [t("fPrice"), t("noCharge")],
        [t("fTier"), t("tierComplimentary")],
      ]
    : subscribed
    ? [
        [t("fPrice"), annual ? t("priceYear", { amount: formatBRL(priceCents, locale) }) : t("price", { amount: formatBRL(priceCents, locale) })],
        [t("fMethod"), sub?.method === "PIX" ? (annual ? t("pixOnce") : t("pix")) : t("card")],
        [status === "trialing" ? t("fTrialEnd") : status === "active" ? (annual ? t("fUntil") : t("fNext")) : t("fAccessUntil"), d(status === "trialing" ? (trialEnd ?? periodEnd) : periodEnd)],
        [t("fTier"), tier === "founder" ? t("tierFounder") : t("tierStandard")],
        [t("fSince"), d(sub?.firstChargedAt ?? sub?.createdAt)],
      ]
    : [];

  const cta =
    status === "free" || status === "read_only"
      ? t("activate")
      : status === "canceled"
        ? t("resubscribe")
        : status === "pending_checkout"
          ? t("retry")
          : status === "active" && annual && renewOpen && !complimentary
            ? t("renew")
            : null;

  return (
    <section id="plan" aria-labelledby="plan-title" className="overflow-hidden rounded-3xl border border-ink/[0.06] bg-card shadow-soft">
      <div className={cn("p-6 sm:p-7", status === "trialing" || status === "active" ? "bg-mint-soft" : "")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Sparkles aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p id="plan-title" className="text-sm text-muted-foreground">
                {t("title")}
              </p>
              <p className="font-medium">{complimentary ? t("nameComplimentary") : annual ? t("nameAnnual") : t("name")}</p>
            </div>
          </div>
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium", Tone.pill)}>
            <Tone.icon aria-hidden="true" className="size-4" />
            {t(`badge.${status}`)}
          </span>
        </div>

        <p className="mt-5 text-2xl font-light sm:text-3xl">{headline}</p>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{complimentary ? t("subComplimentary") : status === "active" && annual ? t("subActiveAnnual", { days: renewWindowDays }) : t(`sub.${status}`)}</p>

        {progress ? (
          <div className="mt-4 max-w-md">
            <div className="h-2 overflow-hidden rounded-full bg-ink/[0.07]" aria-hidden="true">
              <div className={cn("h-full rounded-full", status === "canceled" ? "bg-ink/40" : "bg-vivid")} style={{ width: `${progress.pct}%` }} />
            </div>
            {progress.daysLeft >= 0 ? <p className="mt-1.5 text-xs text-muted-foreground">{t("daysLeft", { count: progress.daysLeft })}</p> : null}
          </div>
        ) : null}

        {subscribed && tier === "founder" ? (
          <p className="mt-4 inline-flex max-w-2xl items-start gap-2 rounded-2xl bg-card/70 px-3 py-2 text-sm">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-vivid-strong" />
            {t("founderNote", { amount: formatBRL(brand.pricing.founderMonthlyCents, locale) })}
          </p>
        ) : null}

        {children}
      </div>

      {details.length ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-ink/[0.06] px-6 py-5 sm:grid-cols-3 sm:px-7 lg:grid-cols-5">
          {details.map(([k, v], i) => (
            <div key={k}>
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="mt-0.5 inline-flex items-center gap-1.5 font-medium tabular-money">
                {i === 1 && !complimentary ? <MethodIcon aria-hidden="true" className="size-4" /> : null}
                {v}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {/* acesso liberado não tem ação (nem assinar, nem cancelar): a faixa some, mas o componente segue montado */}
      <div className={cn("flex flex-wrap items-center gap-3 border-t border-ink/[0.06] px-6 py-4 sm:px-7", complimentary && "hidden")}>
        {cta && billingEnabled ? (
          <Link href="/assinar" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 font-medium text-primary-foreground transition-colors hover:bg-primary/85">
            <Sparkles aria-hidden="true" className="size-4" />
            {cta}
          </Link>
        ) : null}
        {/* sempre montado: assim a confirmação do cancelamento continua na tela quando o cartão atualiza */}
        <CancelSubscription
          canCancel={!complimentary && (status === "trialing" || status === "active" || status === "past_due")}
          trialing={status === "trialing"}
          accessUntil={d(status === "trialing" ? (trialEnd ?? periodEnd) : periodEnd)}
          refundEligible={(status === "active" || status === "past_due") && Boolean(refundUntil && refundUntil.getTime() > now)}
        />
        {refundUntil && refundUntil.getTime() > now && status === "active" && !complimentary ? (
          <p className="text-xs text-muted-foreground">{t("refundUntil", { date: d(refundUntil) })}</p>
        ) : null}
      </div>
    </section>
  );
}
