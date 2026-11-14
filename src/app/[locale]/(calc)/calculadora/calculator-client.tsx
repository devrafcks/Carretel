"use client";
import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { TrendingDown, TrendingUp } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, Notice } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { calculate, validateCalc, CALC_EXAMPLE, DEFAULT_MARGIN_PCT, type CalcInput } from "@/lib/calculator";
import { centsToInput, formatBRL, parseMoneyInput } from "@/lib/money";
import { saveCalculatorProfileAction } from "@/app/actions";
import type { CalculatorProfile } from "@/db/schema";
import { cn } from "@/lib/utils";

const LS_KEY = "carretel.calcProfile";

const noopSubscribe = () => () => {};
function readStored(): string | null {
  try {
    return localStorage.getItem(LS_KEY);
  } catch {
    return null;
  }
}

/** Perfil salvo (servidor) > perfil local (sem login) > exemplo. O `key` reinicia o estado quando o local carrega. */
export function Calculator({ loggedIn, profile }: { loggedIn: boolean; profile: CalculatorProfile | null }) {
  const stored = React.useSyncExternalStore(noopSubscribe, readStored, () => null);
  let local: CalculatorProfile | null = null;
  if (!profile && stored) {
    try {
      local = JSON.parse(stored) as CalculatorProfile;
    } catch {
      local = null;
    }
  }
  return <CalculatorInner key={local ? "local" : "base"} loggedIn={loggedIn} profile={profile ?? local} fromServer={Boolean(profile)} />;
}

function CalculatorInner({ loggedIn, profile, fromServer }: { loggedIn: boolean; profile: CalculatorProfile | null; fromServer: boolean }) {
  const t = useTranslations("calc");
  const locale = useLocale();
  const base = profile ?? CALC_EXAMPLE;
  void fromServer;
  const [fixed, setFixed] = React.useState(centsToInput(base.fixedMonthlyCents));
  const [payroll, setPayroll] = React.useState(centsToInput(base.payrollMonthlyCents));
  const [people, setPeople] = React.useState(String(base.people));
  const [hours, setHours] = React.useState(String(base.hoursPerDay));
  const [days, setDays] = React.useState(String(base.daysPerMonth));
  const [margin, setMargin] = React.useState(String(base.marginPct ?? DEFAULT_MARGIN_PCT));
  const [paceMode, setPaceMode] = React.useState<"pph" | "mpp">("pph");
  const [pace, setPace] = React.useState(String(CALC_EXAMPLE.piecesPerHour));
  const [price, setPrice] = React.useState(centsToInput(CALC_EXAMPLE.offeredPriceCents));
  const [qty, setQty] = React.useState(String(CALC_EXAMPLE.quantity));
  const [pending, start] = React.useTransition();

  const num = (s: string) => Number(s.replace(",", ".")) || 0;
  const input: CalcInput = {
    fixedMonthlyCents: parseMoneyInput(fixed) ?? 0,
    payrollMonthlyCents: parseMoneyInput(payroll) ?? 0,
    people: num(people),
    hoursPerDay: num(hours),
    daysPerMonth: num(days),
    ...(paceMode === "pph" ? { piecesPerHour: num(pace) } : { minutesPerPiece: num(pace) }),
    offeredPriceCents: parseMoneyInput(price) ?? 0,
    quantity: Math.round(num(qty)),
    marginPct: num(margin),
  };
  const err = validateCalc(input);
  const r = err ? null : calculate(input);
  const f = (c: number) => formatBRL(Math.round(c), locale);
  const profileData: CalculatorProfile = {
    fixedMonthlyCents: input.fixedMonthlyCents,
    payrollMonthlyCents: input.payrollMonthlyCents,
    people: input.people,
    hoursPerDay: input.hoursPerDay,
    daysPerMonth: input.daysPerMonth,
    marginPct: input.marginPct ?? DEFAULT_MARGIN_PCT,
  };

  const money = (id: string, label: string, v: string, set: (s: string) => void) => (
    <Field id={id} label={label}>
      {(a) => <Input {...a} inputMode="decimal" value={v} onChange={(e) => set(e.target.value.replace(/[^\d.,]/g, ""))} className="tabular-money" />}
    </Field>
  );
  const numField = (id: string, label: string, v: string, set: (s: string) => void, error?: string | null) => (
    <Field id={id} label={label} error={error}>
      {(a) => <Input {...a} inputMode="decimal" value={v} onChange={(e) => set(e.target.value.replace(/[^\d.,]/g, ""))} className="tabular-money" />}
    </Field>
  );

  return (
    <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <div className="space-y-5">
      {!profile ? (
        <Notice tone="info">
          <p>{t("example")}</p>
        </Notice>
      ) : null}
      <Card className="p-6">
        <h2 className="text-lg font-medium">{t("workshopProfile")}</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {money("cf", t("fixed"), fixed, setFixed)}
          {money("cp", t("payroll"), payroll, setPayroll)}
          {numField("pe", t("people"), people, setPeople, err === "people" ? t("errors.people") : null)}
          {numField("hd", t("hoursPerDay"), hours, setHours, err === "hoursPerDay" ? t("errors.hoursPerDay") : null)}
          {numField("dm", t("daysPerMonth"), days, setDays, err === "daysPerMonth" ? t("errors.daysPerMonth") : null)}
          <Field id="mg" label={t("margin")} hint={t("marginHint")}>
            {(a) => <Input {...a} inputMode="decimal" value={margin} onChange={(e) => setMargin(e.target.value.replace(/[^\d.,]/g, ""))} className="tabular-money" />}
          </Field>
        </div>
        <div className="mt-4">
          {loggedIn ? (
            <Button
              variant="outline"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await saveCalculatorProfileAction(profileData);
                  if (res.ok) toast.success(t("profileSaved"));
                })
              }
            >
              {t("saveProfile")}
            </Button>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                variant="outline"
                onClick={() => {
                  try {
                    localStorage.setItem(LS_KEY, JSON.stringify(profileData));
                    toast.success(t("profileSaved"));
                  } catch {
                    /* sem storage */
                  }
                }}
              >
                {t("saveProfile")}
              </Button>
              <p className="text-muted-foreground">
                <Link href="/entrar" className="font-semibold text-primary underline underline-offset-4">
                  {t("saveNeedsLogin")}
                </Link>
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-medium">{t("offer")}</h2>
        <fieldset className="mt-3">
          <legend className="font-semibold">{t("paceMode")}</legend>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {(
              [
                ["pph", t("piecesPerHour")],
                ["mpp", t("minutesPerPiece")],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                aria-pressed={paceMode === k}
                onClick={() => setPaceMode(k)}
                className={cn("min-h-12 rounded-full border px-3 font-medium transition-colors", paceMode === k ? "border-primary bg-primary text-primary-foreground" : "border-ink/10 bg-card hover:border-ink/30")}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {numField("pc", paceMode === "pph" ? t("piecesPerHour") : t("minutesPerPiece"), pace, setPace, err === "pace" ? t("errors.pace") : null)}
          {money("op", t("offeredPrice"), price, setPrice)}
          {numField("qt", t("quantity"), qty, setQty, err === "quantity" ? t("errors.quantity") : null)}
        </div>
      </Card>
      </div>

      <section aria-live="polite" aria-label={t("title")} className="xl:sticky xl:top-24">
        {r ? (
          <Card className="p-6">
            <div className={cn("flex items-start gap-3 rounded-2xl p-4", r.profitable ? "bg-paid-bg text-paid-fg" : "bg-overdue-calote-bg text-overdue-calote-fg")}>
              {r.profitable ? <TrendingUp aria-hidden="true" className="mt-0.5 size-6 shrink-0" /> : <TrendingDown aria-hidden="true" className="mt-0.5 size-6 shrink-0" />}
              <p className="text-lg font-bold">
                {r.profitable
                  ? t("profit", { amount: f(r.batchMarginCents) })
                  : t("loss", { amount: f(Math.abs(r.batchMarginCents)), missing: f(r.missingPerPieceCents), pph: Math.ceil(r.piecesPerHourToBreakEven) })}
              </p>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <dt className="text-muted-foreground">{t("costPerMinute")}</dt>
                <dd className="tabular-money text-2xl font-light">{formatBRL(Math.round(r.costPerMinuteCents * 100) / 100, locale)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("costPerPiece")}</dt>
                <dd className="tabular-money text-2xl font-light">{f(r.costPerPieceCents)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("minPrice")}</dt>
                <dd className="tabular-money text-2xl font-light">{f(r.minHealthyPriceCents)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("breakEven")}</dt>
                <dd className="tabular-money text-2xl font-light">{r.piecesPerHourToBreakEven.toFixed(1).replace(".", ",")}</dd>
              </div>
            </dl>
            <Link
              href={`/lotes/nuevo?price=${input.offeredPriceCents}&qty=${input.quantity}`}
              className={cn(buttonVariants({ size: "lg", block: true }), "mt-5")}
            >
              {t("acceptBatch")}
            </Link>
          </Card>
        ) : null}
      </section>
    </div>
  );
}
