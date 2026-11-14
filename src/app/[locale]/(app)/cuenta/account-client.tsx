"use client";
import * as React from "react";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CreditCard, QrCode, TriangleAlert } from "@/components/icons";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, Notice } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import {
  cancelSubscriptionAction,
  deleteAccountAction,
  saveSettingsAction,
  startCheckoutAction,
  updatePixAction,
  updateWorkshopAction,
  type ActionResult,
} from "@/app/actions";

function useErr() {
  const t = useTranslations();
  return (code?: string) => (code && t.has(`errors.${code}`) ? t(`errors.${code}` as "errors.server_error") : t("common.errorGeneric"));
}

export function Paywall({ mode, testMode = false, pixAvailable = true }: { mode: "abacatepay" | "simulated" | "disabled"; testMode?: boolean; pixAvailable?: boolean }) {
  const t = useTranslations("account");
  const errMsg = useErr();
  const [busy, setBusy] = React.useState<null | "PIX" | "CARD">(null);
  const [pixOff, setPixOff] = React.useState(!pixAvailable);
  const go = async (m: "PIX" | "CARD") => {
    setBusy(m);
    const r = await startCheckoutAction(m);
    if (r.ok && r.data) window.location.assign(r.data.url);
    else {
      if (!r.ok && r.error === "pix_unavailable") setPixOff(true);
      toast.error(errMsg(r.ok ? undefined : r.error));
      setBusy(null);
    }
  };
  return (
    <div className="mt-4 rounded-3xl bg-mint-soft p-5 sm:p-6">
      <h3 className="text-xl font-medium">{t("paywallTitle")}</h3>
      <p className="mt-1 text-muted-foreground">{t("paywallLead")}</p>
      {/* duas opções lado a lado (empilhadas no mobile), separadas por 12px */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={Boolean(busy) || mode === "disabled" || pixOff}
          onClick={() => void go("PIX")}
          className="flex min-h-24 flex-col items-start justify-center gap-1 rounded-2xl bg-primary px-5 py-4 text-left text-primary-foreground shadow-soft transition-colors hover:bg-primary/85 disabled:bg-muted disabled:text-muted-foreground"
        >
          <span className="inline-flex items-center gap-2 text-lg font-medium">
            <QrCode aria-hidden="true" className="size-5" /> {t("payPix")} · R$ 35
          </span>
          <span className="text-sm opacity-80">{pixOff ? t("pixSoon") : t("payPixNote")}</span>
        </button>
        <button
          type="button"
          disabled={Boolean(busy) || mode === "disabled"}
          onClick={() => void go("CARD")}
          className="flex min-h-24 flex-col items-start justify-center gap-1 rounded-2xl border border-ink/10 bg-card px-5 py-4 text-left shadow-soft transition-colors hover:border-ink/30 disabled:bg-muted disabled:text-muted-foreground"
        >
          <span className="inline-flex items-center gap-2 text-lg font-medium">
            <CreditCard aria-hidden="true" className="size-5" /> {t("payCard")} · R$ 35
          </span>
          <span className="text-sm text-muted-foreground">{t("payCardNote")}</span>
        </button>
      </div>
      {testMode ? <p className="mt-4 rounded-2xl bg-card/80 px-4 py-3 text-sm">{t("testModeNote")}</p> : null}
      {busy ? (
        <p className="mt-3 font-medium" role="status">
          {t("opening")}
        </p>
      ) : null}
    </div>
  );
}

export function CancelSubscription({ refundEligible }: { refundEligible: boolean }) {
  const t = useTranslations("account");
  const router = useRouter();
  const errMsg = useErr();
  const [open, setOpen] = React.useState<null | "cancel" | "refund">(null);
  const [pending, start] = React.useTransition();
  const run = (refund: boolean) =>
    start(async () => {
      const r = await cancelSubscriptionAction(refund);
      if (!r.ok) toast.error(errMsg(r.error));
      else {
        toast.success(t("canceledOk"));
        setOpen(null);
        router.refresh();
      }
    });
  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
      <Button variant="outline" onClick={() => setOpen("cancel")}>
        {t("cancel")}
      </Button>
      {refundEligible ? (
        <Button variant="outline" onClick={() => setOpen("refund")}>
          {t("cancelRefund")}
        </Button>
      ) : null}
      <Dialog open={Boolean(open)} onOpenChange={(o) => !o && setOpen(null)}>
        {open ? (
          <DialogContent title={open === "refund" ? t("cancelRefund") : t("cancel")} closeLabel="×">
            <p>{open === "refund" ? t("refundConfirm") : t("cancelConfirm")}</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row-reverse">
              <Button variant="destructive" disabled={pending} onClick={() => run(open === "refund")}>
                {open === "refund" ? t("cancelRefund") : t("cancel")}
              </Button>
              <Button variant="ghost" onClick={() => setOpen(null)}>
                {t("goBack")}
              </Button>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}

function SaveStatus({ state, okMsg }: { state: ActionResult | null; okMsg: string }) {
  const errMsg = useErr();
  const t = useTranslations("production");
  if (!state) return null;
  if (state.ok)
    return (
      <p role="status" className="font-semibold text-paid-fg">
        {okMsg}
      </p>
    );
  return (
    <p role="alert" className="font-semibold text-destructive">
      {state.error === "doc_invalid" ? t("docInvalid") : errMsg(state.error)}
    </p>
  );
}

export function WorkshopForm({ ws }: { ws: { name: string; district: string; city: string; machineCount: number; phone: string; docType: string; docLast3: string | null } }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(updateWorkshopAction, null);
  return (
    <form action={action} className="mt-3 space-y-4">
      <Field id="wname" label={t("onboarding.name")}>
        {(a) => <Input {...a} name="name" defaultValue={ws.name} required />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="wdist" label={t("onboarding.district")}>
          {(a) => <Input {...a} name="district" defaultValue={ws.district} />}
        </Field>
        <Field id="wcity" label={t("onboarding.city")}>
          {(a) => <Input {...a} name="city" defaultValue={ws.city} />}
        </Field>
        <Field id="wmach" label={t("onboarding.machines")}>
          {(a) => <Input {...a} name="machineCount" inputMode="numeric" defaultValue={ws.machineCount} className="tabular-money" />}
        </Field>
      </div>
      <Field id="wphone" label={t("account.phone")} optional={t("common.optional")}>
        {(a) => <Input {...a} name="phone" type="tel" defaultValue={ws.phone} />}
      </Field>
      <div className="grid grid-cols-[8rem_1fr] gap-3">
        <Field id="wdoct" label={t("account.docType")}>
          {(a) => (
            <Select {...a} name="docType" defaultValue={ws.docType || "cpf"}>
              <option value="cpf">CPF</option>
              <option value="rnm">RNM</option>
              <option value="cnpj">CNPJ</option>
            </Select>
          )}
        </Field>
        <Field id="wdocn" label={t("account.docNumber")} hint={ws.docLast3 ? t("account.docSaved", { last3: ws.docLast3 }) : t("production.docHint")}>
          {(a) => <Input {...a} name="docNumber" autoComplete="off" className="font-mono" />}
        </Field>
      </div>
      <SaveStatus state={state} okMsg={t("account.saved")} />
      <Button type="submit" disabled={pending}>
        {pending ? t("common.saving") : t("common.save")}
      </Button>
    </form>
  );
}

export function PixForm({ pix }: { pix: { type: string; key: string; name: string; city: string } }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(updatePixAction, null);
  return (
    <form action={action} className="mt-3 space-y-4">
      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <Field id="ptype" label={t("onboarding.pixType")}>
          {(a) => (
            <Select {...a} name="pixKeyType" defaultValue={pix.type}>
              {(["evp", "phone", "email", "cpf", "cnpj"] as const).map((k) => (
                <option key={k} value={k}>
                  {t(`pixTypes.${k}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field id="pkey" label={t("onboarding.pixKey")}>
          {(a) => <Input {...a} name="pixKey" defaultValue={pix.key} required className="font-mono" autoCapitalize="none" spellCheck={false} />}
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="pname" label={t("onboarding.pixName")}>
          {(a) => <Input {...a} name="pixMerchantName" defaultValue={pix.name} maxLength={25} required />}
        </Field>
        <Field id="pcity" label={t("onboarding.pixCity")}>
          {(a) => <Input {...a} name="pixCity" defaultValue={pix.city} maxLength={15} required />}
        </Field>
      </div>
      <SaveStatus state={state} okMsg={t("account.saved")} />
      <Button type="submit" disabled={pending}>
        {pending ? t("common.saving") : t("common.save")}
      </Button>
    </form>
  );
}

export function SettingsForm({ period, maxHours }: { period: string; maxHours: string }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(saveSettingsAction, null);
  return (
    <form action={action} className="mt-3 space-y-4">
      <Field id="sp" label={t("account.settlementPeriod")}>
        {(a) => (
          <Select {...a} name="settlementPeriod" defaultValue={period}>
            <option value="weekly">{t("account.weekly")}</option>
            <option value="biweekly">{t("account.biweekly")}</option>
          </Select>
        )}
      </Field>
      <Field id="mh" label={t("account.maxHours")} hint={t("account.maxHoursHint")}>
        {(a) => <Input {...a} name="maxHoursPerDay" inputMode="decimal" defaultValue={maxHours} className="tabular-money max-w-32" />}
      </Field>
      <SaveStatus state={state} okMsg={t("account.saved")} />
      <Button type="submit" disabled={pending}>
        {pending ? t("common.saving") : t("common.save")}
      </Button>
    </form>
  );
}

export function DangerZone({ workshopName }: { workshopName: string }) {
  const t = useTranslations("account");
  const errMsg = useErr();
  const [open, setOpen] = React.useState(false);
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  return (
    <div className="mt-6 border-t border-border pt-4">
      <Button variant="ghost" className="text-destructive" onClick={() => setOpen(true)}>
        <TriangleAlert aria-hidden="true" /> {t("delete")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title={t("delete")} closeLabel="×">
          <Notice tone="danger">
            <p>{t("deleteWarning")}</p>
          </Notice>
          <div className="mt-4">
            <Field id="delc" label={t("deleteConfirmLabel", { name: workshopName })} error={error}>
              {(a) => <Input {...a} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" />}
            </Field>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row-reverse">
            <Button
              variant="destructive"
              disabled={pending || confirm.trim() !== workshopName.trim()}
              onClick={() =>
                start(async () => {
                  const r = await deleteAccountAction(confirm);
                  if (!r.ok) return setError(r.error === "name_mismatch" ? t("deleteMismatch") : errMsg(r.error));
                  toast.success(t("deleted"));
                  window.location.assign("/");
                })
              }
            >
              {t("deleteButton")}
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t("goBack")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function SimulatedCheckout({ method }: { method: string }) {
  const t = useTranslations("account");
  const tStatus = useTranslations("status.plan");
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [last, setLast] = React.useState<string | null>(null);
  const events = [
    ["subscription.completed", t("simCompleted")],
    ...(method === "CARD" ? ([["subscription.trial_started", t("simTrial")]] as const) : []),
    ["subscription.renewed", t("simRenewed")],
    ["subscription.payment_failed", t("simFailed")],
    ["local.period_expired", t("simExpired")],
    ["subscription.cancelled", t("simCancelled")],
  ] as const;
  return (
    <Card className="p-4">
      <div className="grid gap-3">
        {events.map(([ev, label]) => (
          <Button
            key={ev}
            variant={ev === "subscription.completed" ? "primary" : "outline"}
            disabled={pending}
            onClick={() =>
              start(async () => {
                const { simulateBillingEventAction } = await import("@/app/actions");
                const r = await simulateBillingEventAction(ev);
                setLast(r.ok ? ev : `erro: ${r.error}`);
                router.refresh();
              })
            }
          >
            {label}
          </Button>
        ))}
      </div>
      {last ? (
        <p role="status" className="mt-3 font-mono text-sm">
          {last}
        </p>
      ) : null}
      <p className="sr-only">{tStatus("active")}</p>
    </Card>
  );
}
