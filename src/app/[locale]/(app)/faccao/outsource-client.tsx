"use client";
/** Facção: registrar saída (envio), marcar em produção, registrar retorno (bom, defeito, faltante) e ver a diferença na hora. */
import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { errorToast, withRef } from "@/components/app/error-toast";
import { Plus, Trash2, Truck, MessageCircle } from "@/components/icons";
import { useRouter } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { FichaIllustration } from "@/components/brand/illustrations";
import { StatusBadge, type DomainTone } from "@/components/ui/status-badge";
import {
  createShipmentAction,
  deleteReturnAction,
  deleteShipmentAction,
  markShipmentInProductionAction,
  registerReturnAction,
} from "@/app/module-actions";
import { formatDate, todayISO } from "@/lib/dates";
import { summarizeShipment } from "@/lib/outsource";
import { cn, waLink } from "@/lib/utils";

type Status = "sent" | "in_production" | "partial" | "returned";

export type ShipmentView = {
  id: string;
  partnerName: string;
  partnerPhone: string | null;
  reference: string | null;
  quantity: number;
  sentOn: string;
  dueOn: string | null;
  status: Status;
  note: string | null;
  overdue: boolean;
  summary: { sent: number; good: number; defect: number; missing: number; pending: number; difference: number };
  returns: { id: string; returnedOn: string; good: number; defect: number; missing: number; note: string | null }[];
};

type BatchOption = { id: string; label: string; reference: string | null; quantity: number };

const TONE: Record<Status, DomainTone> = { sent: "awaiting-confirmation", in_production: "in-production", partial: "rework", returned: "paid" };
const FILTERS = ["active", "all", "returned"] as const;

function useErr() {
  const t = useTranslations();
  return (code?: string) => (code && t.has(`errors.${code}`) ? t(`errors.${code}` as "errors.server_error") : t("common.errorGeneric"));
}

export function OutsourceBoard({ locale, canWrite, shipments, batches }: { locale: string; canWrite: boolean; shipments: ShipmentView[]; batches: BatchOption[] }) {
  const t = useTranslations("outsource");
  const [creating, setCreating] = React.useState(false);
  const [returnFor, setReturnFor] = React.useState<ShipmentView | null>(null);
  const [filter, setFilter] = React.useState<(typeof FILTERS)[number]>("active");
  const shown = shipments.filter((s) => (filter === "all" ? true : filter === "returned" ? s.status === "returned" : s.status !== "returned"));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {canWrite ? (
          <Button onClick={() => setCreating(true)}>
            <Plus aria-hidden="true" /> {t("new")}
          </Button>
        ) : null}
        <div role="group" aria-label={t("filter")} className="ml-auto inline-flex rounded-full border border-ink/10 bg-card p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={cn("min-h-10 rounded-full px-4 text-sm", filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {t(`filters.${f}`)}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <EmptyState illustration={<FichaIllustration />} title={shipments.length ? t("emptyFilter") : t("empty")} />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {shown.map((s) => (
            <ShipmentCard key={s.id} s={s} locale={locale} canWrite={canWrite} onReturn={() => setReturnFor(s)} />
          ))}
        </ul>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        {creating ? (
          <DialogContent title={t("new")} side="bottom" closeLabel={t("close")}>
            <ShipmentForm batches={batches} onDone={() => setCreating(false)} />
          </DialogContent>
        ) : null}
      </Dialog>
      <Dialog open={Boolean(returnFor)} onOpenChange={(o) => !o && setReturnFor(null)}>
        {returnFor ? (
          <DialogContent title={t("returnTitle", { name: returnFor.partnerName })} side="bottom" closeLabel={t("close")}>
            <ReturnForm s={returnFor} onDone={() => setReturnFor(null)} />
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}

function ShipmentCard({ s, locale, canWrite, onReturn }: { s: ShipmentView; locale: string; canWrite: boolean; onReturn: () => void }) {
  const t = useTranslations("outsource");
  const router = useRouter();
  const errMsg = useErr();
  const [pending, start] = React.useTransition();
  const d = (iso: string) => formatDate(iso, locale);
  const run = (fn: () => Promise<{ ok: boolean; error?: string; ref?: string }>) =>
    start(async () => {
      const r = await fn();
      if (!r.ok) errorToast(errMsg(r.error), r.ref);
      else router.refresh();
    });
  const sum = s.summary;
  const reminder = t("whatsappText", { name: s.partnerName, pending: sum.pending, ref: s.reference ?? "—", due: s.dueOn ? d(s.dueOn) : "—" });

  return (
    <li className="flex flex-col rounded-3xl border border-ink/[0.06] bg-card p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-mint-100 text-accent-foreground">
          <Truck aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{s.partnerName}</p>
          <p className="text-sm text-muted-foreground">
            {s.reference ? `${t("ref", { ref: s.reference })} · ` : ""}
            {t("sentOn", { date: d(s.sentOn) })}
            {s.dueOn ? ` · ${t("dueOn", { date: d(s.dueOn) })}` : ""}
          </p>
        </div>
        <StatusBadge tone={s.overdue ? "overdue-calote" : TONE[s.status]} label={s.overdue ? t("overdue") : t(`status.${s.status}`)} />
      </div>

      <dl className="mt-4 grid grid-cols-4 gap-2 rounded-2xl bg-mint-soft p-3 text-center">
        {(
          [
            ["sent", sum.sent],
            ["good", sum.good],
            ["defect", sum.defect],
            ["pending", sum.pending + sum.missing],
          ] as const
        ).map(([k, n]) => (
          <div key={k}>
            <dt className="text-xs text-muted-foreground">{k === "pending" ? t("qty.notBack") : t(`qty.${k}`)}</dt>
            <dd className={cn("text-xl font-medium tabular-money", k === "defect" && n > 0 && "text-rework-fg", k === "pending" && n > 0 && s.status !== "sent" && s.status !== "in_production" && "text-overdue-calote-fg")}>{n}</dd>
          </div>
        ))}
      </dl>
      {sum.difference > 0 && s.returns.length ? (
        <p className="mt-2 text-sm">
          <span className="font-medium">{t("difference", { count: sum.difference })}</span>{" "}
          <span className="text-muted-foreground">{t("differenceDetail", { defect: sum.defect, missing: sum.missing, pending: sum.pending })}</span>
        </p>
      ) : null}

      {s.returns.length ? (
        <ul className="mt-3 space-y-1 text-sm">
          {s.returns.map((r) => (
            <li key={r.id} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 text-muted-foreground">
                {d(r.returnedOn)}: {t("returnLine", { good: r.good, defect: r.defect, missing: r.missing })}
              </span>
              {canWrite ? (
                <button
                  type="button"
                  className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                  aria-label={t("removeReturn")}
                  disabled={pending}
                  onClick={() => {
                    if (window.confirm(t("removeReturnConfirm"))) run(() => deleteReturnAction(r.id));
                  }}
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {canWrite ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {s.status !== "returned" ? (
            <Button onClick={onReturn}>{t("registerReturn")}</Button>
          ) : null}
          {s.status === "sent" ? (
            <Button variant="outline" disabled={pending} onClick={() => run(() => markShipmentInProductionAction(s.id))}>
              {t("markInProduction")}
            </Button>
          ) : null}
          {s.partnerPhone && s.status !== "returned" ? (
            <a href={waLink(s.partnerPhone, reminder)} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "ghost" })}>
              <MessageCircle aria-hidden="true" /> {t("askStatus")}
            </a>
          ) : null}
          {!s.returns.length ? (
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto"
              aria-label={t("delete")}
              disabled={pending}
              onClick={() => {
                if (window.confirm(t("deleteConfirm"))) run(() => deleteShipmentAction(s.id));
              }}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function ShipmentForm({ batches, onDone }: { batches: BatchOption[]; onDone: () => void }) {
  const t = useTranslations("outsource");
  const tc = useTranslations("common");
  const router = useRouter();
  const errMsg = useErr();
  const today = todayISO();
  const [batchId, setBatchId] = React.useState("");
  const [partnerName, setPartnerName] = React.useState("");
  const [partnerPhone, setPartnerPhone] = React.useState("");
  const [reference, setReference] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [sentOn, setSentOn] = React.useState(today);
  const [dueOn, setDueOn] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string | null>>({});
  const [pending, start] = React.useTransition();

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const qty = Number(quantity) || 0;
        const errs: Record<string, string | null> = {
          partner: partnerName.trim() ? null : tc("required"),
          quantity: qty > 0 ? null : tc("required"),
          dueOn: dueOn && dueOn < sentOn ? t("dueBeforeSent") : null,
        };
        setErrors(errs);
        if (Object.values(errs).some(Boolean)) return;
        start(async () => {
          const r = await createShipmentAction({ batchId: batchId || null, partnerName, partnerPhone: partnerPhone || null, reference: reference || null, quantity: qty, sentOn, dueOn: dueOn || null });
          if (!r.ok) return void errorToast(errMsg(r.error), r.ref);
          toast.success(t("saved"));
          onDone();
          router.refresh();
        });
      }}
    >
      {batches.length ? (
        <Field id="sh-batch" label={t("batch")} optional={tc("optional")}>
          {(a) => (
            <Select
              {...a}
              value={batchId}
              onChange={(e) => {
                setBatchId(e.target.value);
                const b = batches.find((x) => x.id === e.target.value);
                if (b) {
                  if (!reference) setReference(b.reference ?? "");
                  if (!quantity) setQuantity(String(b.quantity));
                }
              }}
            >
              <option value="">{t("noBatch")}</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="sh-partner" label={t("partner")} error={errors.partner}>
          {(a) => <Input {...a} value={partnerName} onChange={(e) => setPartnerName(e.target.value)} maxLength={120} autoComplete="off" />}
        </Field>
        <Field id="sh-phone" label={t("partnerPhone")} optional={tc("optional")}>
          {(a) => <Input {...a} type="tel" inputMode="tel" value={partnerPhone} onChange={(e) => setPartnerPhone(e.target.value)} autoComplete="off" />}
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="sh-ref" label={t("model")} optional={tc("optional")}>
          {(a) => <Input {...a} value={reference} onChange={(e) => setReference(e.target.value)} maxLength={80} className="font-mono" />}
        </Field>
        <Field id="sh-qty" label={t("quantity")} error={errors.quantity}>
          {(a) => <Input {...a} inputMode="numeric" pattern="[0-9]*" value={quantity} onChange={(e) => setQuantity(e.target.value.replace(/\D/g, "").slice(0, 7))} className="tabular-money" />}
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="sh-sent" label={t("sentDate")}>
          {(a) => <Input {...a} type="date" max={today} value={sentOn} onChange={(e) => setSentOn(e.target.value)} />}
        </Field>
        <Field id="sh-due" label={t("dueDate")} optional={tc("optional")} error={errors.dueOn}>
          {(a) => <Input {...a} type="date" min={sentOn} value={dueOn} onChange={(e) => setDueOn(e.target.value)} />}
        </Field>
      </div>
      <Button type="submit" size="lg" block disabled={pending}>
        {pending ? tc("saving") : t("save")}
      </Button>
    </form>
  );
}

function ReturnForm({ s, onDone }: { s: ShipmentView; onDone: () => void }) {
  const t = useTranslations("outsource");
  const tc = useTranslations("common");
  const router = useRouter();
  const errMsg = useErr();
  const today = todayISO();
  const [good, setGood] = React.useState(String(s.summary.pending));
  const [defect, setDefect] = React.useState("0");
  const [missing, setMissing] = React.useState("0");
  const [returnedOn, setReturnedOn] = React.useState(today);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const n = (v: string) => Number(v) || 0;
  const total = n(good) + n(defect) + n(missing);
  // a diferença aparece na hora, enquanto digita
  const preview = summarizeShipment(s.quantity, [...s.returns.map((r) => ({ goodQty: r.good, defectQty: r.defect, missingQty: r.missing })), { goodQty: n(good), defectQty: n(defect), missingQty: n(missing) }]);
  const over = total > s.summary.pending;
  const num = (v: string) => v.replace(/\D/g, "").slice(0, 7);

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (total <= 0) return setError(t("returnEmpty"));
        if (over) return setError(t("returnOver", { max: s.summary.pending }));
        setError(null);
        start(async () => {
          const r = await registerReturnAction({ shipmentId: s.id, returnedOn, goodQty: n(good), defectQty: n(defect), missingQty: n(missing) });
          if (!r.ok) return setError(withRef(errMsg(r.error), r.ref));
          toast.success(r.data?.status === "returned" ? t("returnedAll") : t("returnSaved"));
          onDone();
          router.refresh();
        });
      }}
    >
      <p className="text-sm text-muted-foreground">{t("returnLead", { sent: s.quantity, pending: s.summary.pending })}</p>
      <div className="grid grid-cols-3 gap-3">
        <Field id="rt-good" label={t("qty.good")}>
          {(a) => <Input {...a} inputMode="numeric" pattern="[0-9]*" value={good} onChange={(e) => setGood(num(e.target.value))} className="tabular-money text-lg" />}
        </Field>
        <Field id="rt-defect" label={t("qty.defect")}>
          {(a) => <Input {...a} inputMode="numeric" pattern="[0-9]*" value={defect} onChange={(e) => setDefect(num(e.target.value))} className="tabular-money text-lg" />}
        </Field>
        <Field id="rt-missing" label={t("qty.missing")}>
          {(a) => <Input {...a} inputMode="numeric" pattern="[0-9]*" value={missing} onChange={(e) => setMissing(num(e.target.value))} className="tabular-money text-lg" />}
        </Field>
      </div>
      <Card className={cn("p-4", over ? "border-overdue-calote-border" : "")} aria-live="polite">
        <p className="font-medium">{over ? t("returnOver", { max: s.summary.pending }) : t("difference", { count: preview.difference })}</p>
        <p className="text-sm text-muted-foreground">{t("previewDetail", { good: preview.good, sent: preview.sent, pending: preview.pending })}</p>
      </Card>
      <Field id="rt-date" label={t("returnDate")} error={error}>
        {(a) => <Input {...a} type="date" max={today} min={s.sentOn} value={returnedOn} onChange={(e) => setReturnedOn(e.target.value)} />}
      </Field>
      <Button type="submit" size="lg" block disabled={pending}>
        {pending ? tc("saving") : t("saveReturn")}
      </Button>
    </form>
  );
}
