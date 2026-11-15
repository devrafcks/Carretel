"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CalendarDue, Check, CreditCard, Lock, LogIn, QrCode, RefreshCw, Shield, ShieldCheck, UserPlus, type AppIcon } from "@/components/icons";
import { LoginForm } from "@/app/[locale]/(auth)/entrar/login-form";
import { OnboardingForm } from "@/app/[locale]/(auth)/bienvenida/onboarding-form";
import { startCheckoutAction } from "@/app/actions";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

type StepKey = "account" | "workshop" | "payment";
type Cycle = "monthly" | "annual";

/** O que o servidor calculou para esta oficina (src/server/billing.ts → pricingOffer). */
export type CheckoutOffer = {
  tier: "founder" | "standard";
  locked: boolean;
  founderSpots: number;
  foundersLeft: number | null;
  monthlyCents: number;
  annualCents: number;
  standardMonthlyCents: number;
  annualInstallments: number;
  annualDiscountPct: number;
};

type Props = {
  locale: string;
  loggedIn: boolean;
  email: string | null;
  workshopName: string | null;
  authMode: "neon" | "dev";
  devAllowed: boolean;
  billing: "abacatepay" | "simulated" | "disabled";
  testMode: boolean;
  pixAvailable: boolean;
  trialDays: number;
  trialEligible: boolean;
  canceledNotice?: boolean;
  offer: CheckoutOffer;
  /** plano anual ativo perto do fim: só a renovação anual aparece */
  renewAnnual: boolean;
  renewWindowDays: number;
  /** ?plano=anual (botão do anual na landing) */
  initialCycle?: Cycle;
};

export function SubscribeFlow(props: Props) {
  const t = useTranslations("subscribe");
  // os três passos sempre aparecem; quem já está logado (upgrade do painel) cai direto no pagamento com os anteriores concluídos
  const shown: StepKey[] = ["account", "workshop", "payment"];
  const current: StepKey = !props.loggedIn ? "account" : !props.workshopName ? "workshop" : "payment";
  const label = (k: StepKey) => (k === "account" ? t("stepAccount") : k === "workshop" ? t("stepWorkshop") : t("stepPayment"));
  const idx = shown.indexOf(current);

  return (
    <div className={cn("w-full", current === "payment" ? "max-w-4xl" : "max-w-xl")}>
      <div className="text-center">
        <h1 className="text-hero text-4xl sm:text-5xl">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("lead")}</p>
      </div>

      {/* progresso */}
      <ol className="mx-auto mt-7 flex max-w-md items-center gap-2" aria-label={t("stepOf", { n: idx + 1, total: shown.length })}>
        {shown.map((s, i) => {
          const done = i < idx;
          const active = i === idx;
          return (
            <li key={s} className="flex flex-1 items-center gap-2 last:flex-none" aria-current={active ? "step" : undefined}>
              <span
                className={cn(
                  "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium",
                  done ? "bg-vivid-strong text-primary-foreground" : active ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground shadow-soft",
                )}
              >
                {done ? <Check aria-hidden="true" className="size-4" stroke={2.4} /> : i + 1}
              </span>
              <span className={cn("truncate text-sm", active ? "font-medium" : "text-muted-foreground")}>{label(s)}</span>
              {i < shown.length - 1 ? <span aria-hidden="true" className={cn("h-px min-w-4 flex-1", done ? "bg-vivid-strong" : "bg-ink/10")} /> : null}
            </li>
          );
        })}
      </ol>

      {props.canceledNotice ? (
        <p role="status" className="mx-auto mt-6 max-w-xl rounded-2xl bg-awaiting-confirmation-bg px-4 py-3 text-center text-sm text-awaiting-confirmation-fg">
          {t("canceledNotice")}
        </p>
      ) : null}

      <div className="mt-7">
        {current === "account" ? (
          <Panel>
            <AccountStep {...props} />
          </Panel>
        ) : current === "workshop" ? (
          <Panel>
            <WorkshopStep email={props.email} initialCycle={props.initialCycle} />
          </Panel>
        ) : (
          <PaymentStep {...props} />
        )}
      </div>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[2rem] border border-ink/[0.06] bg-card p-6 shadow-lift sm:p-8">{children}</div>;
}

/* ───── 1. Conta: pergunta antes, depois entra ou cria ali mesmo ───── */
function AccountStep({ locale, authMode, devAllowed, initialCycle }: Props) {
  const t = useTranslations("subscribe");
  const [choice, setChoice] = React.useState<"login" | "signup" | null>(null);
  const next = `/${locale}/assinar${initialCycle === "annual" ? "?plano=anual" : ""}`;

  if (!choice) {
    return (
      <div>
        <h2 className="text-xl font-medium">{t("accountTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("accountLead")}</p>
        <div className="mt-5 grid gap-3">
          {(
            [
              ["login", LogIn, t("haveAccount"), t("haveAccountHint")],
              ["signup", UserPlus, t("newAccount"), t("newAccountHint")],
            ] as const
          ).map(([k, Icon, title, hint]) => (
            <button
              key={k}
              type="button"
              onClick={() => setChoice(k)}
              className="group flex min-h-20 items-center gap-4 rounded-2xl border border-ink/10 px-5 py-4 text-left transition-colors hover:border-ink/40 hover:bg-mint-50"
            >
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-mint-100 text-vivid-strong">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{title}</span>
                <span className="block text-sm text-muted-foreground">{hint}</span>
              </span>
              <ArrowRight aria-hidden="true" className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-xl font-medium">{choice === "login" ? t("loginTitle") : t("signupTitle")}</h2>
        <button type="button" onClick={() => setChoice(null)} className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm text-muted-foreground hover:bg-mint-50 hover:text-foreground">
          <ArrowLeft aria-hidden="true" className="size-4" />
          {t("changeChoice")}
        </button>
      </div>
      {/* depois de entrar/criar, a página recarrega já com sessão e o servidor manda para o próximo passo */}
      <LoginForm key={choice} mode={authMode} devAllowed={devAllowed} next={next} initialTab={choice} embedded />
    </div>
  );
}

/* ───── 2. Taller (só para conta nova) ───── */
function WorkshopStep({ email, initialCycle }: { email: string | null; initialCycle?: Cycle }) {
  const t = useTranslations("subscribe");
  return (
    <div>
      <h2 className="text-xl font-medium">{t("workshopTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("workshopLead")}</p>
      {email ? <p className="mt-3 inline-flex rounded-full bg-mint-50 px-3 py-1 text-xs">{t("signedAs", { email })}</p> : null}
      <OnboardingForm returnTo={initialCycle === "annual" ? "assinar-anual" : "assinar"} />
    </div>
  );
}

/* ───── 3. Pagamento: plano (mensal/anual) e forma de pagamento à esquerda, resumo do pedido à direita ───── */
function PaymentStep({ locale, email, workshopName, billing, testMode, pixAvailable, trialDays, trialEligible, offer, renewAnnual, renewWindowDays, initialCycle = "monthly" }: Props) {
  const t = useTranslations("subscribe");
  const tl = useTranslations("landing");
  const te = useTranslations("errors");
  const ta = useTranslations("account");
  const [cycle, setCycle] = React.useState<Cycle>(renewAnnual ? "annual" : initialCycle);
  const [pixOff, setPixOff] = React.useState(!pixAvailable);
  // Pix é o padrão (taxa menor): no mensal só quando o Pix Automático está liberado; no anual é Pix comum, sempre
  const [method, setMethod] = React.useState<"CARD" | "PIX">(renewAnnual || initialCycle === "annual" || pixAvailable ? "PIX" : "CARD");
  const [busy, setBusy] = React.useState(false);
  const features = tl.raw("planFeatures") as string[];
  const annual = cycle === "annual";
  const pixDisabled = !annual && pixOff;
  const withTrial = !annual && method === "CARD" && trialEligible;
  const brl = (c: number) => formatBRL(c, locale);
  const monthly = brl(offer.monthlyCents);
  const yearly = brl(offer.annualCents);
  const annualPerMonth = brl(Math.round(offer.annualCents / 12));
  const installment = brl(Math.ceil(offer.annualCents / offer.annualInstallments));
  const savings = Math.max(0, offer.monthlyCents * 12 - offer.annualCents);
  const dueToday = withTrial ? 0 : annual ? offer.annualCents : offer.monthlyCents;
  const showFounder = offer.tier === "founder";

  function chooseCycle(c: Cycle) {
    setCycle(c);
    // ao trocar de ciclo, volta ao padrão: Pix (anual = Pix comum; mensal = Pix Automático, se liberado)
    setMethod(c === "annual" || !pixOff ? "PIX" : "CARD");
  }

  async function go() {
    setBusy(true);
    const r = await startCheckoutAction(method, cycle);
    if (r.ok && r.data) {
      window.location.assign(r.data.url);
      return;
    }
    const code = r.ok ? "server_error" : r.error;
    if (code === "pix_unavailable") {
      setPixOff(true);
      setMethod("CARD");
    }
    toast.error(te.has(code) ? te(code as "server_error") : te("server_error"));
    setBusy(false);
  }

  const cycles = [
    { key: "monthly" as const, title: t("cycleMonthly"), hint: t("cycleMonthlyHint", { amount: monthly }), badge: null, disabled: renewAnnual },
    {
      key: "annual" as const,
      title: t("cycleAnnual"),
      hint: t("cycleAnnualHint", { amount: yearly, perMonth: annualPerMonth, pct: offer.annualDiscountPct }),
      badge: savings > 0 ? t("annualSave", { amount: brl(savings) }) : null,
      disabled: false,
    },
  ];

  const options = [
    {
      key: "PIX" as const,
      icon: QrCode,
      title: annual ? t("pixAnnualTitle") : t("pixTitle"),
      hint: annual ? t("pixAnnualHint") : pixOff ? t("pixSoon") : t("pixHint"),
      badge: pixDisabled ? null : t("pixDefaultBadge"),
      disabled: pixDisabled,
    },
    {
      key: "CARD" as const,
      icon: CreditCard,
      title: t("cardTitle"),
      hint: annual ? t("cardAnnualHint", { n: offer.annualInstallments, amount: installment }) : trialEligible ? t("cardHint", { days: trialDays }) : t("cardHintNoTrial"),
      badge: !annual && trialEligible ? t("trialBadge", { days: trialDays }) : null,
      disabled: false,
    },
  ];

  return (
    <div className="overflow-hidden rounded-[2rem] border border-ink/[0.06] bg-card shadow-lift md:grid md:grid-cols-[1.15fr_1fr]">
      {/* plano e forma de pagamento */}
      <div className="p-6 sm:p-8">
        <h2 className="text-xl font-medium">{renewAnnual ? t("renewTitle") : t("paymentTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{renewAnnual ? t("renewLead") : t("paymentLead")}</p>

        {showFounder && !renewAnnual ? (
          <div className="mt-5 rounded-2xl border border-mint-200 bg-mint-50 px-4 py-3">
            <p className="flex items-center gap-2 font-medium">
              <ShieldCheck aria-hidden="true" className="size-5 shrink-0 text-vivid-strong" />
              {offer.locked ? t("founderLocked", { amount: monthly }) : t("founderTitle", { amount: monthly })}
            </p>
            {!offer.locked ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {offer.foundersLeft !== null ? <span className="font-medium text-foreground">{t("founderSpots", { count: offer.foundersLeft, total: offer.founderSpots })}. </span> : null}
                {t("founderBody", { total: offer.founderSpots, amount: monthly, next: brl(offer.standardMonthlyCents) })}
              </p>
            ) : null}
          </div>
        ) : null}

        <OptionGroup
          legend={t("cycleLegend")}
          name="cycle"
          value={cycle}
          onChange={(k) => chooseCycle(k as Cycle)}
          options={cycles.map((c) => ({ ...c, icon: c.key === "annual" ? CalendarDue : RefreshCw }))}
          className="mt-6"
        />

        <OptionGroup legend={t("paymentTitle")} name="method" value={method} onChange={(k) => setMethod(k as "CARD" | "PIX")} options={options} className="mt-6" />

        {testMode ? <p className="mt-4 rounded-2xl bg-mint-50 px-4 py-3 text-xs">{ta("testModeNote")}</p> : null}

        {billing === "disabled" ? (
          <p className="mt-5 rounded-2xl bg-mint-50 px-4 py-3 text-sm">{t("disabled")}</p>
        ) : (
          <button
            type="button"
            onClick={() => void go()}
            disabled={busy}
            className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-lg font-medium text-primary-foreground shadow-lift transition-colors hover:bg-primary/85 disabled:opacity-70"
          >
            <Lock aria-hidden="true" className="size-5" />
            {busy ? t("opening") : withTrial ? t("continueTrial", { days: trialDays }) : t("continuePay", { amount: brl(dueToday) })}
          </button>
        )}
        <p className="mt-3 flex items-start justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <Shield aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          {t("secureNote")}
        </p>
      </div>

      {/* resumo do pedido */}
      <aside className="border-t border-ink/[0.06] bg-mint-soft p-6 sm:p-8 md:border-l md:border-t-0">
        <p className="text-sm font-medium text-muted-foreground">{t("summaryTitle")}</p>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-medium">{annual ? t("planNameAnnual") : t("planName")}</p>
            <p className="text-sm text-muted-foreground">{annual ? t("billedAnnually") : t("billedMonthly")}</p>
          </div>
          <p className="shrink-0 text-lg font-medium tabular-money">
            {annual ? yearly : monthly}
            <span className="text-sm font-normal text-muted-foreground">{annual ? t("perYear") : t("perMonth")}</span>
          </p>
        </div>

        <ul className="mt-5 space-y-2 text-sm">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-vivid-strong" stroke={2.2} />
              {f}
            </li>
          ))}
        </ul>

        <dl className="mt-6 space-y-2 border-t border-ink/10 pt-5 text-sm">
          {withTrial ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t("trialLine", { days: trialDays })}</dt>
              <dd className="font-medium text-vivid-strong">{t("free")}</dd>
            </div>
          ) : null}
          {annual ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t("annualLine")}</dt>
              <dd className="tabular-money">{t("annualPerMonth", { amount: annualPerMonth })}</dd>
            </div>
          ) : (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{withTrial ? t("afterTrial") : t("monthly")}</dt>
              <dd className="tabular-money">
                {monthly}
                {t("perMonth")}
              </dd>
            </div>
          )}
          <div className="flex items-baseline justify-between gap-3 border-t border-ink/10 pt-3">
            <dt className="font-medium">{t("dueToday")}</dt>
            <dd className="text-2xl font-medium tabular-money" aria-live="polite">
              {brl(dueToday)}
            </dd>
          </div>
          {annual && method === "CARD" ? <p className="text-right text-xs text-muted-foreground">{t("installmentsNote", { n: offer.annualInstallments, amount: installment })}</p> : null}
        </dl>

        {workshopName || email ? (
          <div className="mt-6 space-y-1 rounded-2xl bg-card/70 px-4 py-3 text-xs text-muted-foreground">
            {workshopName ? <p className="truncate">{t("workshopOf", { name: workshopName })}</p> : null}
            {email ? <p className="truncate">{t("signedAs", { email })}</p> : null}
          </div>
        ) : null}
        <p className="mt-4 text-xs text-muted-foreground">{annual ? t("annualNoAuto", { days: renewWindowDays }) : t("cancelAnytime")}</p>
      </aside>
    </div>
  );
}

type Option = { key: string; icon: AppIcon; title: string; hint: string; badge: string | null; disabled: boolean };

/** Grupo de opções em cartões (rádio nativo dentro do label). */
function OptionGroup({ legend, name, value, onChange, options, className }: { legend: string; name: string; value: string; onChange: (key: string) => void; options: Option[]; className?: string }) {
  return (
    <fieldset className={className}>
      <legend className="mb-3 text-sm font-medium text-muted-foreground">{legend}</legend>
      <div className="grid gap-3">
        {options.map((o) => (
          // eslint-disable-next-line jsx-a11y/label-has-associated-control -- o texto (título + dica) é dinâmico e o input está dentro do label
          <label
            key={o.key}
            htmlFor={`${name}-${o.key}`}
            className={cn(
              "flex min-h-20 cursor-pointer items-center gap-4 rounded-2xl border-2 px-5 py-4 transition-colors",
              o.disabled ? "cursor-not-allowed border-ink/5 opacity-55" : value === o.key ? "border-primary bg-mint-50" : "border-ink/10 hover:border-ink/30",
            )}
          >
            <input id={`${name}-${o.key}`} type="radio" name={name} value={o.key} checked={value === o.key} disabled={o.disabled} onChange={() => onChange(o.key)} className="size-5 accent-[var(--primary)]" />
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-card shadow-soft">
              <o.icon aria-hidden="true" className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2 font-medium">
                {o.title}
                {o.badge ? <span className="rounded-full bg-vivid-strong px-2 py-0.5 text-[0.6875rem] font-medium text-primary-foreground">{o.badge}</span> : null}
              </span>
              <span className="block text-sm text-muted-foreground">{o.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
