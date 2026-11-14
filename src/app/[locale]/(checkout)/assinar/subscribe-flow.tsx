"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, CreditCard, Lock, LogIn, QrCode, Shield, UserPlus } from "@/components/icons";
import { LoginForm } from "@/app/[locale]/(auth)/entrar/login-form";
import { OnboardingForm } from "@/app/[locale]/(auth)/bienvenida/onboarding-form";
import { startCheckoutAction } from "@/app/actions";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

type StepKey = "account" | "workshop" | "payment";

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
  priceCents: number;
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

      <div className="mt-7">
        {current === "account" ? (
          <Panel>
            <AccountStep {...props} />
          </Panel>
        ) : current === "workshop" ? (
          <Panel>
            <WorkshopStep email={props.email} />
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
function AccountStep({ locale, authMode, devAllowed }: Props) {
  const t = useTranslations("subscribe");
  const [choice, setChoice] = React.useState<"login" | "signup" | null>(null);
  const next = `/${locale}/assinar`;

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
function WorkshopStep({ email }: { email: string | null }) {
  const t = useTranslations("subscribe");
  return (
    <div>
      <h2 className="text-xl font-medium">{t("workshopTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("workshopLead")}</p>
      {email ? <p className="mt-3 inline-flex rounded-full bg-mint-50 px-3 py-1 text-xs">{t("signedAs", { email })}</p> : null}
      <OnboardingForm returnTo="assinar" />
    </div>
  );
}

/* ───── 3. Pagamento: forma de pagamento à esquerda, resumo do pedido à direita ───── */
function PaymentStep({ locale, email, workshopName, billing, testMode, pixAvailable, trialDays, trialEligible, priceCents }: Props) {
  const t = useTranslations("subscribe");
  const tl = useTranslations("landing");
  const te = useTranslations("errors");
  const ta = useTranslations("account");
  const [method, setMethod] = React.useState<"CARD" | "PIX">("CARD");
  const [pixOff, setPixOff] = React.useState(!pixAvailable);
  const [busy, setBusy] = React.useState(false);
  const features = tl.raw("planFeatures") as string[];
  const withTrial = method === "CARD" && trialEligible;
  const price = formatBRL(priceCents, locale);

  async function go() {
    setBusy(true);
    const r = await startCheckoutAction(method);
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

  const options = [
    {
      key: "CARD" as const,
      icon: CreditCard,
      title: t("cardTitle"),
      hint: trialEligible ? t("cardHint", { days: trialDays }) : t("cardHintNoTrial"),
      badge: trialEligible ? t("trialBadge", { days: trialDays }) : null,
      disabled: false,
    },
    { key: "PIX" as const, icon: QrCode, title: t("pixTitle"), hint: pixOff ? t("pixSoon") : t("pixHint"), badge: null, disabled: pixOff },
  ];

  return (
    <div className="overflow-hidden rounded-[2rem] border border-ink/[0.06] bg-card shadow-lift md:grid md:grid-cols-[1.15fr_1fr]">
      {/* forma de pagamento */}
      <div className="p-6 sm:p-8">
        <h2 className="text-xl font-medium">{t("paymentTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("paymentLead")}</p>

        <fieldset className="mt-6">
          <legend className="sr-only">{t("paymentTitle")}</legend>
          <div className="grid gap-3">
            {options.map((o) => (
              // eslint-disable-next-line jsx-a11y/label-has-associated-control -- o texto (título + dica) é dinâmico e o input está dentro do label
              <label
                key={o.key}
                htmlFor={`method-${o.key}`}
                className={cn(
                  "flex min-h-20 cursor-pointer items-center gap-4 rounded-2xl border-2 px-5 py-4 transition-colors",
                  o.disabled ? "cursor-not-allowed border-ink/5 opacity-55" : method === o.key ? "border-primary bg-mint-50" : "border-ink/10 hover:border-ink/30",
                )}
              >
                <input id={`method-${o.key}`} type="radio" name="method" value={o.key} checked={method === o.key} disabled={o.disabled} onChange={() => setMethod(o.key)} className="size-5 accent-[var(--primary)]" />
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
            {busy ? t("opening") : withTrial ? t("continueTrial", { days: trialDays }) : t("continuePay", { amount: price })}
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
            <p className="text-lg font-medium">{t("planName")}</p>
            <p className="text-sm text-muted-foreground">{t("billedMonthly")}</p>
          </div>
          <p className="shrink-0 text-lg font-medium tabular-money">
            {price}
            <span className="text-sm font-normal text-muted-foreground">{t("perMonth")}</span>
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
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{withTrial ? t("afterTrial") : t("monthly")}</dt>
            <dd className="tabular-money">
              {price}
              {t("perMonth")}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 border-t border-ink/10 pt-3">
            <dt className="font-medium">{t("dueToday")}</dt>
            <dd className="text-2xl font-medium tabular-money">{withTrial ? formatBRL(0, locale) : price}</dd>
          </div>
        </dl>

        {workshopName || email ? (
          <div className="mt-6 space-y-1 rounded-2xl bg-card/70 px-4 py-3 text-xs text-muted-foreground">
            {workshopName ? <p className="truncate">{t("workshopOf", { name: workshopName })}</p> : null}
            {email ? <p className="truncate">{t("signedAs", { email })}</p> : null}
          </div>
        ) : null}
        <p className="mt-4 text-xs text-muted-foreground">{t("cancelAnytime")}</p>
      </aside>
    </div>
  );
}
