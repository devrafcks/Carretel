"use client";
import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Banknote, CircleCheck, ExternalLink, Lock, MessageCircle, Plus, RotateCcw, Scale, UserPlus, UserX } from "@/components/icons";
import { useRouter, Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, Notice } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select, Checkbox } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { FichaIllustration } from "@/components/brand/illustrations";
import { StatusBadge } from "@/components/ui/status-badge";
import { useOffline } from "@/components/app/offline-provider";
import {
  anonymizeWorkerAction,
  closeSettlementAction,
  createAdjustmentAction,
  markSettlementPaidAction,
  reopenSettlementAction,
} from "@/app/actions";
import { formatBRL, parseMoneyInput } from "@/lib/money";
import { todayISO } from "@/lib/dates";
import { receiptMessage } from "@/lib/wa-templates";
import { cn, initials, waLink } from "@/lib/utils";

const MACHINES = ["recta", "overlock", "collareta", "interlock", "other"] as const;
const AVATAR = [
  "bg-primary text-primary-foreground",
  "bg-vivid-strong text-primary-foreground",
  "bg-paid-solid text-paid-solid-fg",
  "bg-sun text-ink",
];

function useErr() {
  const t = useTranslations();
  return (code?: string) => (code && t.has(`errors.${code}`) ? t(`errors.${code}` as "errors.server_error") : t("common.errorGeneric"));
}

/* ─────────── Aba Hoje: cards de pessoas ─────────── */
interface WorkerCard {
  id: string;
  name: string;
  todayPieces: number;
  pendingCents: number;
  advancesCents: number;
}

export function ProductionToday({
  workers,
  batches,
  ops,
  canWrite,
}: {
  workers: WorkerCard[];
  batches: { id: string; label: string }[];
  ops: { id: string; batchId: string; machine: string; rate: number }[];
  canWrite: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const [logFor, setLogFor] = React.useState<WorkerCard | null>(null);
  const [advFor, setAdvFor] = React.useState<WorkerCard | null>(null);

  if (workers.length === 0) {
    return (
      <EmptyState
        illustration={<FichaIllustration />}
        title={t("production.empty")}
        action={
          <Link href="/produccion?tab=equipo" className={buttonVariants({ size: "lg", block: true })}>
            {t("production.addPerson")}
          </Link>
        }
      />
    );
  }

  return (
    <>
      {batches.length === 0 ? (
        <Notice tone="info" className="mb-4">
          <p>{t("production.noOpenBatches")}</p>
        </Notice>
      ) : null}
      <ul className="grid gap-3 sm:grid-cols-2">
        {workers.map((w, i) => (
          <li key={w.id} className="anim-rise" style={{ animationDelay: `${i * 70}ms` }}>
            <Card className="lift p-5">
              <button
                type="button"
                disabled={!canWrite || batches.length === 0}
                onClick={() => setLogFor(w)}
                className="flex w-full min-h-16 items-center gap-3 rounded-lg text-left disabled:cursor-not-allowed"
              >
                <span aria-hidden="true" className={cn("inline-flex size-16 shrink-0 items-center justify-center rounded-2xl font-display text-xl font-extrabold shadow-soft", AVATAR[i % AVATAR.length])}>
                  {initials(w.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-lg font-bold">{w.name}</span>
                  <span className="block tabular-money">{t("production.todayPieces", { pieces: t("common.pieces", { count: w.todayPieces }) })}</span>
                  <span className="block text-muted-foreground tabular-money">{t("production.pendingAmount", { amount: formatBRL(w.pendingCents - w.advancesCents, locale) })}</span>
                </span>
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft">
                  <Plus aria-hidden="true" className="size-6" />
                </span>
              </button>
              {canWrite ? (
                <Button variant="secondary" block className="mt-3" onClick={() => setAdvFor(w)}>
                  <Banknote aria-hidden="true" /> {t("production.advance")}
                </Button>
              ) : null}
            </Card>
          </li>
        ))}
      </ul>

      <Dialog open={Boolean(logFor)} onOpenChange={(o) => !o && setLogFor(null)}>
        {logFor ? (
          <DialogContent title={t("production.logTitle", { name: logFor.name })} side="bottom" closeLabel={t("common.close")}>
            <LogForm worker={logFor} batches={batches} ops={ops} onDone={() => setLogFor(null)} />
          </DialogContent>
        ) : null}
      </Dialog>
      <Dialog open={Boolean(advFor)} onOpenChange={(o) => !o && setAdvFor(null)}>
        {advFor ? (
          <DialogContent title={t("production.advanceTitle", { name: advFor.name })} side="bottom" closeLabel={t("common.close")}>
            <AdvanceForm worker={advFor} onDone={() => setAdvFor(null)} />
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}

function LogForm({ worker, batches, ops, onDone }: { worker: WorkerCard; batches: { id: string; label: string }[]; ops: { id: string; batchId: string; machine: string; rate: number }[]; onDone: () => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const errMsg = useErr();
  const { submit } = useOffline();
  const [batchId, setBatchId] = React.useState(batches[0]?.id ?? "");
  const batchOps = ops.filter((o) => o.batchId === batchId);
  const [opKey, setOpKey] = React.useState<string>(batchOps[0]?.id ?? "new:recta");
  const [rate, setRate] = React.useState("");
  const [pieces, setPieces] = React.useState(0);
  const [hours, setHours] = React.useState("");
  const [date, setDate] = React.useState(todayISO());
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isNew = opKey.startsWith("new:");
  const selectedOp = ops.find((o) => o.id === opKey);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (pieces <= 0) return setError(t("common.required"));
    const rateCents = parseMoneyInput(rate);
    if (isNew && !rateCents) return setError(t("errors.operation_rate_required"));
    setBusy(true);
    const payload: Record<string, unknown> = {
      workerId: worker.id,
      batchId,
      pieces,
      workDate: date,
      ...(hours ? { hours: Number(hours.replace(",", ".")) } : {}),
      ...(isNew ? { machine: opKey.slice(4), pieceRateCents: rateCents } : { operationId: opKey }),
    };
    const r = await submit("production.log", payload).catch(() => ({ queued: false, ok: false, error: "server_error" }));
    setBusy(false);
    if (r.queued) toast.success(t("common.savedOffline"));
    else if (r.ok) toast.success(t("production.logged", { pieces: t("common.pieces", { count: pieces }), name: worker.name }));
    else return setError(errMsg(r.error));
    onDone();
  }

  return (
    <form onSubmit={save} className="space-y-4" noValidate>
      <Field id="lb" label={t("production.chooseBatch")}>
        {(a) => (
          <Select
            {...a}
            value={batchId}
            onChange={(e) => {
              setBatchId(e.target.value);
              setOpKey(ops.find((o) => o.batchId === e.target.value)?.id ?? "new:recta");
            }}
          >
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <fieldset>
        <legend className="font-semibold">{t("production.chooseOperation")}</legend>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          {batchOps.map((o) => (
            // eslint-disable-next-line jsx-a11y/label-has-associated-control -- o texto vem de expressões t() dentro do label
            <label key={o.id} className={cn("flex min-h-12 items-center gap-2 rounded-2xl border px-3", opKey === o.id ? "border-primary bg-mint-50" : "border-input")}>
              <input type="radio" name="op" className="size-5 accent-primary" checked={opKey === o.id} onChange={() => setOpKey(o.id)} />
              <span>
                <span className="block font-semibold">{t(`machines.${o.machine}` as "machines.recta")}</span>
                <span className="tabular-money text-muted-foreground">{formatBRL(o.rate, locale)}</span>
              </span>
            </label>
          ))}
          {MACHINES.filter((m) => !batchOps.some((o) => o.machine === m)).map((m) => (
            <label key={m} className={cn("flex min-h-12 items-center gap-2 rounded-2xl border border-dashed px-3", opKey === `new:${m}` ? "border-primary bg-mint-50" : "border-input")}>
              <input type="radio" name="op" className="size-5 accent-primary" checked={opKey === `new:${m}`} onChange={() => setOpKey(`new:${m}`)} />
              <span className="font-semibold">{t(`machines.${m}`)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {isNew ? (
        <Field id="lr" label={t("production.ratePrompt")}>
          {(a) => <Input {...a} inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value.replace(/[^\d.,]/g, ""))} className="tabular-money" placeholder="0,40" />}
        </Field>
      ) : null}

      <fieldset>
        <legend className="font-semibold">{t("production.pieces")}</legend>
        <div className="mt-1.5 flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="−1" onClick={() => setPieces((p) => Math.max(0, p - 1))}>
            −
          </Button>
          <input
            aria-label={t("production.pieces")}
            inputMode="numeric"
            value={pieces || ""}
            onChange={(e) => setPieces(Number(e.target.value.replace(/\D/g, "")) || 0)}
            className="tabular-money h-14 w-full min-w-0 rounded-2xl border border-input bg-card text-center text-3xl font-bold"
          />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[1, 10, 50].map((n) => (
            <Button key={n} variant="secondary" size="lg" onClick={() => setPieces((p) => p + n)}>
              +{n}
            </Button>
          ))}
        </div>
        {selectedOp || rate ? (
          <p className="mt-2 font-semibold tabular-money" aria-live="polite">
            = {formatBRL(pieces * (selectedOp?.rate ?? parseMoneyInput(rate) ?? 0), locale)}
          </p>
        ) : null}
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <Field id="ld" label={t("production.date")}>
          {(a) => <Input {...a} type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />}
        </Field>
        <Field id="lh" label={t("production.hours")}>
          {(a) => <Input {...a} inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value.replace(/[^\d.,]/g, ""))} className="tabular-money" />}
        </Field>
      </div>
      <p aria-live="polite" className="font-semibold text-destructive">
        {error}
      </p>
      <Button type="submit" size="lg" block disabled={busy}>
        {busy ? t("common.saving") : t("production.saveLog")}
      </Button>
    </form>
  );
}

function AdvanceForm({ worker, onDone }: { worker: WorkerCard; onDone: () => void }) {
  const t = useTranslations();
  const errMsg = useErr();
  const { submit } = useOffline();
  const [amount, setAmount] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        const c = parseMoneyInput(amount);
        if (!c) return setError(t("common.required"));
        setBusy(true);
        const r = await submit("advance.create", { workerId: worker.id, amountCents: c, givenOn: todayISO(), reason: reason || undefined }).catch(() => ({ queued: false, ok: false, error: "server_error" }));
        setBusy(false);
        if (r.queued) toast.success(t("common.savedOffline"));
        else if (r.ok) toast.success(t("production.advanceSaved"));
        else return setError(errMsg(r.error));
        onDone();
      }}
    >
      <Field id="aa" label={t("production.advanceAmount")} error={error}>
        {(a) => <Input {...a} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))} className="tabular-money min-h-14 text-2xl font-bold" autoFocus />}
      </Field>
      <Field id="ar" label={t("production.advanceReason")}>
        {(a) => <Input {...a} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} />}
      </Field>
      <Button type="submit" size="lg" block disabled={busy}>
        {busy ? t("common.saving") : t("production.advance")}
      </Button>
    </form>
  );
}

/* ─────────── Aba Acerto ─────────── */
interface Preview {
  workerId: string;
  name: string;
  phone: string | null;
  gross: number;
  advances: number;
  net: number;
  daysWorked: number;
  perDay: number;
  belowMinWage: boolean;
  excessHours: boolean;
  pieces: number;
}
interface SettlementRow {
  id: string;
  workerName: string;
  workerPhone: string | null;
  status: "draft" | "review" | "paid";
  gross: number;
  advances: number;
  net: number;
  token: string;
  isAdjustment: boolean;
  belowMinWage: boolean;
  periodEnd: string;
}

export function SettlementPanel({
  previews,
  settlements,
  period,
  periodLabel,
  baseUrl,
  canWrite,
  minWageConfigured,
}: {
  previews: Preview[];
  settlements: SettlementRow[];
  period: { start: string; end: string };
  periodLabel: string;
  baseUrl: string;
  canWrite: boolean;
  minWageConfigured: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const errMsg = useErr();
  const [pending, start] = React.useTransition();
  const [adjustFor, setAdjustFor] = React.useState<SettlementRow | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okMsg?: string) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) toast.error(errMsg(r.error));
      else {
        if (okMsg) toast.success(okMsg);
        router.refresh();
      }
    });
  const f = (c: number) => formatBRL(c, locale);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display">{t("production.settleTitle")}</h2>
        <p className="text-muted-foreground">{periodLabel}</p>
      </div>
      {!minWageConfigured ? (
        <Notice tone="clt" icon={<Scale />}>
          <p>{t("production.cltParamMissing")}</p>
        </Notice>
      ) : null}

      {previews.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink/20 bg-card px-4 py-8 text-center text-muted-foreground">{t("production.settleNothing")}</p>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {previews.map((p) => (
            <li key={p.workerId}>
              <Card className="anim-rise flex h-full flex-col p-5">
                <p className="text-lg font-medium">{p.name}</p>
                <dl className="mt-2 grid grid-cols-3 gap-2">
                  <div>
                    <dt className="text-muted-foreground">{t("receipt.production")}</dt>
                    <dd className="tabular-money font-semibold">{f(p.gross)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t("receipt.advances")}</dt>
                    <dd className="tabular-money font-semibold">− {f(p.advances)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t("receipt.net")}</dt>
                    <dd className={cn("tabular-money text-xl font-bold", p.net < 0 && "text-overdue-calote-fg")}>{f(p.net)}</dd>
                  </div>
                </dl>
                <p className="mb-4 mt-2 text-muted-foreground tabular-money">
                  {t("production.perDay", { amount: f(p.perDay), days: t("common.days", { count: p.daysWorked }) })} · {t("common.pieces", { count: p.pieces })}
                </p>
                {p.belowMinWage ? (
                  <Notice tone="clt" icon={<Scale />} className="mt-3" role="status">
                    <p>{t("production.cltWarning", { name: p.name })}</p>
                  </Notice>
                ) : null}
                {p.excessHours ? (
                  <Notice tone="clt" icon={<Scale />} className="mt-3">
                    <p>{t("production.hoursWarning")}</p>
                  </Notice>
                ) : null}
                {canWrite ? (
                  <Button className="mt-auto self-start" disabled={pending} onClick={() => run(() => closeSettlementAction(p.workerId, period))}>
                    {t("production.settleCalc")}
                  </Button>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}

      <section aria-labelledby="hist">
        <h2 id="hist" className="mb-2 font-display">
          {t("production.history")}
        </h2>
        {settlements.length === 0 ? (
          <p className="text-muted-foreground">{t("production.noHistory")}</p>
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2">
            {settlements.map((s) => {
              const url = `${baseUrl}/${locale}/r/${s.token}`;
              const msg = receiptMessage(locale as "es" | "pt-BR", { worker: s.workerName, grossCents: s.gross, advancesCents: s.advances, netCents: s.net, url });
              return (
                <li key={s.id}>
                  <Card className="anim-rise p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">
                        {s.isAdjustment ? `${t("production.adjustment")} · ` : ""}
                        {s.workerName}
                      </p>
                      <StatusBadge tone={s.status === "paid" ? "paid" : "awaiting-confirmation"} icon={s.status === "paid" ? CircleCheck : undefined} label={t(`status.settlement.${s.status}`)} />
                    </div>
                    <p className="mt-1 tabular-money">{t("production.settleLine", { name: s.workerName, net: f(s.net), gross: f(s.gross), advances: f(s.advances) })}</p>
                    {s.status === "paid" ? (
                      <p className="mt-2 flex items-center gap-2 text-muted-foreground">
                        <Lock aria-hidden="true" className="size-4" /> {t("production.locked")}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <a href={waLink(s.workerPhone, msg)} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "whatsapp" })}>
                        <MessageCircle aria-hidden="true" /> {t("production.sendWhatsapp")}
                      </a>
                      <a href={`/${locale}/r/${s.token}`} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline" })}>
                        <ExternalLink aria-hidden="true" /> {t("production.openReceipt")}
                      </a>
                      {canWrite && s.status !== "paid" ? (
                        <>
                          <Button disabled={pending} onClick={() => run(() => markSettlementPaidAction(s.id))}>
                            <CircleCheck aria-hidden="true" /> {t("production.markPaid")}
                          </Button>
                          <Button variant="ghost" disabled={pending} onClick={() => run(() => reopenSettlementAction(s.id))}>
                            <RotateCcw aria-hidden="true" /> {t("production.reopen")}
                          </Button>
                        </>
                      ) : null}
                      {canWrite && s.status === "paid" ? (
                        <Button variant="ghost" onClick={() => setAdjustFor(s)}>
                          {t("production.adjust")}
                        </Button>
                      ) : null}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Dialog open={Boolean(adjustFor)} onOpenChange={(o) => !o && setAdjustFor(null)}>
        {adjustFor ? (
          <DialogContent title={t("production.adjust")} description={adjustFor.workerName} side="bottom" closeLabel={t("common.close")}>
            <AdjustForm id={adjustFor.id} onDone={() => setAdjustFor(null)} />
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}

function AdjustForm({ id, onDone }: { id: string; onDone: () => void }) {
  const t = useTranslations();
  const router = useRouter();
  const errMsg = useErr();
  const [amount, setAmount] = React.useState("");
  const [note, setNote] = React.useState("");
  const [pending, start] = React.useTransition();
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const neg = amount.trim().startsWith("-");
        const c = parseMoneyInput(amount.replace("-", ""));
        if (!c || !note.trim()) return;
        start(async () => {
          const r = await createAdjustmentAction(id, neg ? -c : c, note);
          if (!r.ok) toast.error(errMsg(r.error));
          else {
            toast.success(t("production.adjustSaved"));
            onDone();
            router.refresh();
          }
        });
      }}
    >
      <Field id="adj-a" label={t("production.adjustAmount")}>
        {(a) => <Input {...a} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className="tabular-money" />}
      </Field>
      <Field id="adj-n" label={t("production.adjustNote")}>
        {(a) => <Input {...a} value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />}
      </Field>
      <Button type="submit" block size="lg" disabled={pending}>
        {t("production.adjust")}
      </Button>
    </form>
  );
}

/* ─────────── Aba Equipe ─────────── */
export function TeamPanel({ workers, canWrite }: { workers: { id: string; name: string; phone: string | null; isEmployee: boolean; docLast3: string | null }[]; canWrite: boolean }) {
  const t = useTranslations();
  const router = useRouter();
  const errMsg = useErr();
  const { submit } = useOffline();
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [isEmployee, setIsEmployee] = React.useState(false);
  const [docType, setDocType] = React.useState<"cpf" | "rnm">("cpf");
  const [docNumber, setDocNumber] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();

  return (
    <div className="space-y-5">
      {canWrite ? (
        <Card className="anim-rise p-5">
          <h2 className="flex items-center gap-2 font-display text-lg">
            <UserPlus aria-hidden="true" className="size-5 text-primary" /> {t("production.addPerson")}
          </h2>
          <form
            className="mt-3 space-y-4"
            noValidate
            onSubmit={async (e) => {
              e.preventDefault();
              if (!name.trim()) return setError(t("common.required"));
              setBusy(true);
              setError(null);
              const payload = { name: name.trim(), phone: phone || undefined, isEmployee, ...(docNumber ? { docType, docNumber } : {}) };
              const r = await submit("worker.create", payload).catch(() => ({ queued: false, ok: false, error: "server_error" }));
              setBusy(false);
              if (!r.ok) return setError(errMsg(r.error));
              toast.success(r.queued ? t("common.savedOffline") : t("production.personSaved"));
              setName("");
              setPhone("");
              setDocNumber("");
              setIsEmployee(false);
            }}
          >
            <Field id="wn" label={t("production.personName")} error={error}>
              {(a) => <Input {...a} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} autoComplete="off" />}
            </Field>
            <Field id="wp" label={t("production.personPhone")}>
              {(a) => <Input {...a} type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="off" />}
            </Field>
            <label className="flex min-h-12 items-start gap-3">
              <Checkbox checked={isEmployee} onChange={(e) => setIsEmployee(e.target.checked)} />
              <span>{t("production.isEmployee")}</span>
            </label>
            <div className="grid grid-cols-[8rem_1fr] gap-3">
              <Field id="wdt" label={t("production.docType")}>
                {(a) => (
                  <Select {...a} value={docType} onChange={(e) => setDocType(e.target.value as "cpf" | "rnm")}>
                    <option value="cpf">CPF</option>
                    <option value="rnm">RNM</option>
                  </Select>
                )}
              </Field>
              <Field id="wdn" label={t("production.docNumber")} hint={t("production.docHint")}>
                {(a) => <Input {...a} value={docNumber} onChange={(e) => setDocNumber(e.target.value)} autoComplete="off" className="font-mono" />}
              </Field>
            </div>
            <Button type="submit" size="lg" block disabled={busy}>
              {busy ? t("common.saving") : t("production.savePerson")}
            </Button>
          </form>
        </Card>
      ) : null}

      {workers.length === 0 ? (
        <EmptyState illustration={<FichaIllustration />} title={t("production.empty")} />
      ) : (
        <ul className="anim-rise divide-y divide-border overflow-hidden rounded-2xl border border-ink/10 bg-card shadow-soft">
          {workers.map((w) => (
            <li key={w.id} className="flex items-center gap-3 px-4 py-3">
              <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-in-production-bg font-bold text-in-production-fg">
                {initials(w.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{w.name}</p>
                <p className="text-muted-foreground">
                  {w.isEmployee ? "CLT" : "—"}
                  {w.docLast3 ? <span className="font-mono"> · ***{w.docLast3}</span> : null}
                  {w.phone ? <span className="tabular-money"> · {w.phone}</span> : null}
                </p>
              </div>
              {canWrite ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`${t("production.anonymize")}: ${w.name}`}
                  disabled={pending}
                  onClick={() => {
                    if (!window.confirm(t("production.anonymizeConfirm"))) return;
                    start(async () => {
                      const r = await anonymizeWorkerAction(w.id);
                      if (!r.ok) toast.error(errMsg(r.error));
                      else router.refresh();
                    });
                  }}
                >
                  <UserX aria-hidden="true" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
