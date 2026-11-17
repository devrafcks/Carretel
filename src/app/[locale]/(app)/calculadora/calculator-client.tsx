"use client";
import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowRight, Pencil, TrendingDown, TrendingUp, Info } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
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
  return <CalculatorInner key={local ? "local" : "base"} loggedIn={loggedIn} profile={profile ?? local} />;
}

const clean = (s: string) => s.replace(/[^\d.,]/g, "");

/** Campo numérico com prefixo/sufixo dentro da caixa (R$, peças, min). */
function UnitInput({
  id,
  label,
  value,
  onChange,
  prefix,
  suffix,
  error,
  hint,
  big,
  placeholder,
}: {
  placeholder?: string;
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  error?: string | null;
  hint?: string;
  big?: boolean;
}) {
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      {(a) => (
        <div className="relative">
          {prefix ? <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">{prefix}</span> : null}
          <Input
            {...a}
            inputMode="decimal"
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(clean(e.target.value))}
            className={cn("tabular-money", prefix && "pl-11", suffix && "pr-20", big && "min-h-14 text-xl")}
          />
          {suffix ? <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{suffix}</span> : null}
        </div>
      )}
    </Field>
  );
}

function StepTitle({ n, title, hint }: { n: number; title: string; hint?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">{n}</span>
      <div>
        <h2 className="text-lg font-medium leading-8">{title}</h2>
        {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  );
}

function CalculatorInner({ loggedIn, profile }: { loggedIn: boolean; profile: CalculatorProfile | null }) {
  const t = useTranslations("calc");
  const locale = useLocale();
  const base = profile ?? CALC_EXAMPLE;
  const [fixed, setFixed] = React.useState(centsToInput(base.fixedMonthlyCents));
  const [payroll, setPayroll] = React.useState(centsToInput(base.payrollMonthlyCents));
  const [people, setPeople] = React.useState(String(base.people));
  const [hours, setHours] = React.useState(String(base.hoursPerDay));
  const [days, setDays] = React.useState(String(base.daysPerMonth));
  const [margin, setMargin] = React.useState(String(base.marginPct ?? DEFAULT_MARGIN_PCT));
  const [paceMode, setPaceMode] = React.useState<"pph" | "mpp">("pph");
  const [pace, setPace] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [qty, setQty] = React.useState("");
  const [editing, setEditing] = React.useState(!profile);
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
  const offerFilled = Boolean(price.trim() && qty.trim() && pace.trim());
  const rawErr = validateCalc(input);
  const offerErr = rawErr === "offeredPrice" || rawErr === "quantity" || rawErr === "pace";
  // enquanto o corte não está preenchido, não acusa erro nesses campos
  const err = !offerFilled && offerErr ? null : rawErr;
  const r = !offerFilled || rawErr ? null : calculate(input);
  const f = (c: number) => formatBRL(Math.round(c), locale);
  const profileData: CalculatorProfile = {
    fixedMonthlyCents: input.fixedMonthlyCents,
    payrollMonthlyCents: input.payrollMonthlyCents,
    people: input.people,
    hoursPerDay: input.hoursPerDay,
    daysPerMonth: input.daysPerMonth,
    marginPct: input.marginPct ?? DEFAULT_MARGIN_PCT,
  };
  const costErr = err === "people" || err === "hoursPerDay" || err === "daysPerMonth";
  const showCostFields = editing || costErr;

  function save() {
    if (loggedIn) {
      start(async () => {
        const res = await saveCalculatorProfileAction(profileData);
        if (res.ok) {
          toast.success(t("profileSaved"));
          setEditing(false);
        }
      });
      return;
    }
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(profileData));
      toast.success(t("profileSaved"));
      setEditing(false);
    } catch {
      /* sem storage */
    }
  }

  // escada de preço: custo, mínimo saudável e oferecido na mesma escala
  const ladder = r
    ? [
        { key: "cost", label: t("ladderCost"), cents: r.costPerPieceCents, tone: "bg-ink/25" },
        { key: "min", label: t("ladderMin"), cents: r.minHealthyPriceCents, tone: "bg-ink/50" },
        { key: "offer", label: t("ladderOffer"), cents: input.offeredPriceCents, tone: r.profitable ? "bg-vivid" : "bg-overdue-calote-fg" },
      ]
    : [];
  const ladderMax = Math.max(1, ...ladder.map((l) => l.cents)) * 1.08;
  const workHours = r ? (input.quantity * r.minutesPerPiece) / 60 / Math.max(1, input.people) : 0;

  return (
    <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        {/* 1 — o corte oferecido (o que muda a cada conversa) */}
        <section className="rounded-3xl xl:col-start-1 xl:row-start-1 border border-ink/[0.06] bg-card p-6 shadow-soft">
          <StepTitle n={1} title={t("step1")} />
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <UnitInput id="op" label={t("offeredPrice")} value={price} onChange={setPrice} placeholder={centsToInput(CALC_EXAMPLE.offeredPriceCents)} prefix="R$" suffix={t("perPiece")} big error={err === "offeredPrice" ? t("errors.offeredPrice") : null} />
            <UnitInput id="qt" label={t("quantity")} value={qty} onChange={setQty} placeholder={String(CALC_EXAMPLE.quantity)} suffix={t("piecesUnit")} big error={err === "quantity" ? t("errors.quantity") : null} />
          </div>
          <fieldset className="mt-5">
            <legend className="text-[0.9375rem] font-medium">{t("paceMode")}</legend>
            <div className="mt-2 grid grid-cols-2 gap-1 rounded-full bg-mint-50 p-1">
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
                  className={cn(
                    "min-h-11 rounded-full px-3 text-sm font-medium transition-colors",
                    paceMode === k ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-3 max-w-xs">
              <UnitInput
                id="pc"
                label={paceMode === "pph" ? t("piecesPerHour") : t("minutesPerPiece")}
                value={pace}
                onChange={setPace}
                placeholder={paceMode === "pph" ? String(CALC_EXAMPLE.piecesPerHour) : "6"}
                suffix={paceMode === "pph" ? t("pphUnit") : t("mppUnit")}
                hint={t("paceHint")}
                error={err === "pace" ? t("errors.pace") : null}
              />
            </div>
          </fieldset>
        </section>

      {/* resultado */}
      <section data-tour="calc-result" aria-live="polite" aria-label={t("title")} className="xl:sticky xl:top-24 xl:col-start-2 xl:row-span-2 xl:row-start-1">
        {r ? (
          <div className="overflow-hidden rounded-3xl border border-ink/[0.06] bg-card shadow-soft">
            <div className={cn("p-6", r.profitable ? "bg-mint-soft" : "bg-overdue-calote-bg")}>
              <p className={cn("inline-flex items-center gap-2 font-medium", r.profitable ? "text-vivid-strong" : "text-overdue-calote-fg")}>
                {r.profitable ? <TrendingUp aria-hidden="true" className="size-5" /> : <TrendingDown aria-hidden="true" className="size-5" />}
                {r.profitable ? t("verdictProfit") : t("verdictLoss")}
              </p>
              <p className={cn("mt-2 text-5xl font-light tabular-money", !r.profitable && "text-overdue-calote-fg")}>
                {r.profitable ? "+" : "−"}
                {f(Math.abs(r.batchMarginCents))}
              </p>
              <p className="mt-2 text-sm">
                {r.profitable
                  ? t("perPieceMargin", { amount: f(input.offeredPriceCents - r.costPerPieceCents) })
                  : t("loss", { amount: f(Math.abs(r.batchMarginCents)), missing: f(r.missingPerPieceCents), pph: Math.ceil(r.piecesPerHourToBreakEven) })}
              </p>
            </div>

            <div className="p-6">
              <p className="text-sm font-medium text-muted-foreground">{t("ladderTitle")}</p>
              <ul className="mt-3 space-y-3">
                {ladder.map((l) => (
                  <li key={l.key}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className={cn(l.key === "offer" && "font-medium")}>{l.label}</span>
                      <span className="tabular-money">{f(l.cents)}</span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-mint-50">
                      <div className={cn("anim-grow-x h-full rounded-full", l.tone)} style={{ width: `${(l.cents / ladderMax) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>

              <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-ink/[0.06] pt-5">
                <div>
                  <dt className="text-sm text-muted-foreground">{t("revenue")}</dt>
                  <dd className="mt-0.5 text-xl font-light tabular-money">{f(input.offeredPriceCents * input.quantity)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t("workHours")}</dt>
                  <dd className="mt-0.5 text-xl font-light tabular-money">{t("workHoursValue", { h: workHours.toFixed(1).replace(".", ",") })}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t("costPerMinute")}</dt>
                  <dd className="mt-0.5 text-xl font-light tabular-money">{formatBRL(Math.round(r.costPerMinuteCents * 100) / 100, locale)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">{t("breakEven")}</dt>
                  <dd className="mt-0.5 text-xl font-light tabular-money">{r.piecesPerHourToBreakEven.toFixed(1).replace(".", ",")}</dd>
                </div>
              </dl>

              {!r.profitable ? <p className="mt-5 rounded-2xl bg-mint-50 px-4 py-3 text-sm">{t("negotiate", { amount: f(r.minHealthyPriceCents) })}</p> : null}

              <Link
                href={`/lotes/nuevo?price=${input.offeredPriceCents}&qty=${input.quantity}`}
                className={cn(
                  "group mt-5 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full px-6 font-medium transition-colors",
                  r.profitable ? "bg-primary text-primary-foreground hover:bg-primary/85" : "border border-ink/20 hover:border-ink/50",
                )}
              >
                {r.profitable ? t("acceptBatch") : t("acceptAnyway")}
                <ArrowRight aria-hidden="true" className="size-5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-ink/15 px-6 py-12 text-center">
            <p className="font-medium">{t("waitingTitle")}</p>
            <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">{t("fillToSee")}</p>
          </div>
        )}
      </section>

        {/* 2 — custos do taller (uma vez) */}
        <section data-tour="calc-costs" className="rounded-3xl xl:col-start-1 xl:row-start-2 border border-ink/[0.06] bg-card p-6 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <StepTitle n={2} title={t("step2")} hint={t("step2Hint")} />
            {!showCostFields ? (
              <button type="button" onClick={() => setEditing(true)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-ink/15 px-4 text-sm font-medium hover:border-ink/40">
                <Pencil aria-hidden="true" className="size-4" />
                {t("editCosts")}
              </button>
            ) : null}
          </div>

          {!profile ? (
            <p className="mt-4 inline-flex items-start gap-2 rounded-2xl bg-mint-50 px-4 py-3 text-sm">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-vivid-strong" />
              {t("example")}
            </p>
          ) : null}

          {showCostFields ? (
            <>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <UnitInput id="cf" label={t("fixed")} value={fixed} onChange={setFixed} prefix="R$" />
                <UnitInput id="cp" label={t("payroll")} value={payroll} onChange={setPayroll} prefix="R$" />
                <UnitInput id="pe" label={t("people")} value={people} onChange={setPeople} error={err === "people" ? t("errors.people") : null} />
                <UnitInput id="hd" label={t("hoursPerDay")} value={hours} onChange={setHours} suffix="h" error={err === "hoursPerDay" ? t("errors.hoursPerDay") : null} />
                <UnitInput id="dm" label={t("daysPerMonth")} value={days} onChange={setDays} error={err === "daysPerMonth" ? t("errors.daysPerMonth") : null} />
                <UnitInput id="mg" label={t("margin")} value={margin} onChange={setMargin} suffix="%" hint={t("marginHint")} />
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button onClick={save} disabled={pending || costErr}>
                  {t("saveProfile")}
                </Button>
                {!loggedIn ? (
                  <Link href="/entrar?conta=nova" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
                    {t("saveNeedsLogin")}
                  </Link>
                ) : null}
              </div>
            </>
          ) : (
            <ul className="mt-5 flex flex-wrap gap-2 text-sm">
              {[
                `${t("fixedShort")} ${f(input.fixedMonthlyCents)}`,
                `${t("payrollShort")} ${f(input.payrollMonthlyCents)}`,
                t("peopleShort", { n: input.people }),
                t("hoursShort", { n: input.hoursPerDay }),
                t("daysShort", { n: input.daysPerMonth }),
                t("marginShort", { n: input.marginPct ?? DEFAULT_MARGIN_PCT }),
              ].map((chip) => (
                <li key={chip} className="rounded-full bg-mint-50 px-3 py-1.5 tabular-money">
                  {chip}
                </li>
              ))}
            </ul>
          )}
        </section>
    </div>
  );
}
