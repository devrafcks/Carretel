"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, CreditCard, Lock, LogIn, QrCode, UserPlus } from "@/components/icons";
import { LoginForm } from "../entrar/login-form";
import { OnboardingForm } from "../bienvenida/onboarding-form";
import { startCheckoutAction } from "@/app/actions";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

type StepKey = "account" | "workshop" | "payment";

export function SubscribeFlow(props: {
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
  priceCents: number;
}) {
  const t = useTranslations("subscribe");
  // os três passos sempre aparecem; quem já está logado (upgrade do painel) cai direto no pagamento com os anteriores concluídos
  const shown: StepKey[] = ["account", "workshop", "payment"];
  const current: StepKey = !props.loggedIn ? "account" : !props.workshopName ? "workshop" : "payment";
  const label = (k: StepKey) => (k === "account" ? t("stepAccount") : k === "workshop" ? t("stepWorkshop") : t("stepPayment"));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-hero text-4xl sm:text-5xl">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("lead")}</p>
      </div>

      {/* progresso */}
      <ol className="flex items-center gap-2" aria-label={t("stepOf", { n: shown.indexOf(current) + 1, total: shown.length })}>
        {shown.map((s, i) => {
          const idx = shown.indexOf(current);
          const done = i < idx;
          const active = i === idx;
          return (
            <li key={s} className="flex flex-1 items-center gap-2" aria-current={active ? "step" : undefined}>
              <span
                className={cn(
                  "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium",
                  done ? "bg-vivid-strong text-primary-foreground" : active ? "bg-primary text-primary-foreground" : "bg-mint-50 text-muted-foreground",
                )}
              >
                {done ? <Check aria-hidden="true" className="size-4" stroke={2.4} /> : i + 1}
              </span>
              <span className={cn("truncate text-sm", active ? "font-medium" : "text-muted-foreground")}>{label(s)}</span>
              {i < shown.length - 1 ? <span aria-hidden="true" className={cn("h-px flex-1", done ? "bg-vivid-strong" : "bg-ink/10")} /> : null}
            </li>
          );
        })}
      </ol>

      <div className="rounded-3xl border border-ink/[0.06] bg-card p-6 shadow-soft sm:p-8">
        {current === "account" ? <AccountStep {...props} /> : current === "workshop" ? <WorkshopStep email={props.email} /> : <PaymentStep {...props} />}
      </div>
    </div>
  );
}

/* ───── 1. Conta: pergunta antes, depois entra ou cria ali mesmo ───── */
function AccountStep({ locale, authMode, devAllowed }: { locale: string; authMode: "neon" | "dev"; devAllowed: boolean }) {
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

/* ───── 3. Pagamento ───── */
function PaymentStep({
  locale,
  email,
  workshopName,
  billing,
  testMode,
  pixAvailable,
  trialDays,
  priceCents,
}: {
  locale: string;
  email: string | null;
  workshopName: string | null;
  billing: "abacatepay" | "simulated" | "disabled";
  testMode: boolean;
  pixAvailable: boolean;
  trialDays: number;
  priceCents: number;
}) {
  const t = useTranslations("subscribe");
  const tl = useTranslations("landing");
  const te = useTranslations("errors");
  const ta = useTranslations("account");
  const [method, setMethod] = React.useState<"CARD" | "PIX">("CARD");
  const [pixOff, setPixOff] = React.useState(!pixAvailable);
  const [busy, setBusy] = React.useState(false);
  const features = (tl.raw("planFeatures") as string[]).slice(0, 4);

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
    { key: "CARD" as const, icon: CreditCard, title: t("cardTitle"), hint: t("cardHint", { days: trialDays }), badge: t("recommended"), disabled: false },
    { key: "PIX" as const, icon: QrCode, title: t("pixTitle"), hint: pixOff ? t("pixSoon") : t("pixHint"), badge: null, disabled: pixOff },
  ];

  return (
    <div>
      <h2 className="text-xl font-medium">{t("paymentTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("paymentLead")}</p>
      {email || workshopName ? (
        <p className="mt-3 flex flex-wrap gap-2 text-xs">
          {workshopName ? <span className="rounded-full bg-mint-50 px-3 py-1">{t("workshopOf", { name: workshopName })}</span> : null}
          {email ? <span className="rounded-full bg-mint-50 px-3 py-1">{t("signedAs", { email })}</span> : null}
        </p>
      ) : null}

      {/* resumo do plano */}
      <div className="mt-5 rounded-2xl bg-mint-soft p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-medium">{t("planName")}</p>
          <p className="text-2xl font-light tabular-money">
            {formatBRL(priceCents, locale)}
            <span className="text-sm text-muted-foreground">{t("perMonth")}</span>
          </p>
        </div>
        <ul className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-vivid-strong" stroke={2} />
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* forma de pagamento */}
      <fieldset className="mt-5">
        <legend className="sr-only">{t("paymentTitle")}</legend>
        <div className="grid gap-3">
          {options.map((o) => (
            // eslint-disable-next-line jsx-a11y/label-has-associated-control -- o texto (título + dica) é dinâmico e o input está dentro do label
            <label
              key={o.key}
              htmlFor={`method-${o.key}`}
              className={cn(
                "flex min-h-20 cursor-pointer items-center gap-4 rounded-2xl border px-5 py-4 transition-colors",
                o.disabled ? "cursor-not-allowed border-ink/5 opacity-60" : method === o.key ? "border-primary bg-mint-50" : "border-ink/10 hover:border-ink/30",
              )}
            >
              <input id={`method-${o.key}`} type="radio" name="method" value={o.key} checked={method === o.key} disabled={o.disabled} onChange={() => setMethod(o.key)} className="size-5 accent-[var(--primary)]" />
              <o.icon aria-hidden="true" className="size-6 shrink-0" />
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

      {testMode ? <p className="mt-4 rounded-2xl bg-mint-50 px-4 py-3 text-sm">{ta("testModeNote")}</p> : null}

      {billing === "disabled" ? (
        <p className="mt-5 rounded-2xl bg-mint-50 px-4 py-3 text-sm">{t("disabled")}</p>
      ) : (
        <button
          type="button"
          onClick={() => void go()}
          disabled={busy}
          className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-lg font-medium text-primary-foreground shadow-lift transition-colors hover:bg-primary/85 disabled:opacity-70"
        >
          <Lock aria-hidden="true" className="size-5" />
          {busy ? t("opening") : t("continue")}
        </button>
      )}
      <p className="mt-3 text-center text-xs text-muted-foreground">{t("secureNote")}</p>
    </div>
  );
}
