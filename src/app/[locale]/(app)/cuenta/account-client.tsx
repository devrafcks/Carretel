"use client";
import * as React from "react";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Sparkles, TriangleAlert } from "@/components/icons";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, Notice } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import {
  cancelSubscriptionAction,
  deleteAccountAction,
  saveSettingsAction,
  updatePixAction,
  updateWorkshopAction,
  type ActionResult,
} from "@/app/actions";

function useErr() {
  const t = useTranslations();
  return (code?: string) => (code && t.has(`errors.${code}`) ? t(`errors.${code}` as "errors.server_error") : t("common.errorGeneric"));
}

/** Na tela Conta, o plano é ativado pelo mesmo fluxo de assinatura em passos (/assinar). */
export function Paywall({ mode }: { mode: "abacatepay" | "simulated" | "disabled"; testMode?: boolean; pixAvailable?: boolean }) {
  const t = useTranslations("account");
  const ts = useTranslations("subscribe");
  return (
    <div className="mt-4 flex flex-col gap-4 rounded-3xl bg-mint-soft p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div>
        <h3 className="text-xl font-medium">{t("paywallTitle")}</h3>
        <p className="mt-1 text-muted-foreground">{ts("paymentLead")}</p>
      </div>
      {mode === "disabled" ? (
        <p className="text-sm">{ts("disabled")}</p>
      ) : (
        <Link href="/assinar" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-6 font-medium text-primary-foreground transition-colors hover:bg-primary/85">
          <Sparkles aria-hidden="true" className="size-5" />
          {ts("upgrade")}
        </Link>
      )}
    </div>
  );
}

export function CancelSubscription({ refundEligible, trialing = false, accessUntil = "" }: { refundEligible: boolean; trialing?: boolean; accessUntil?: string }) {
  const t = useTranslations("plan");
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
    <>
      <Button variant="outline" onClick={() => setOpen("cancel")}>
        {trialing ? t("cancelTrial") : t("cancel")}
      </Button>
      {refundEligible ? (
        <Button variant="ghost" onClick={() => setOpen("refund")}>
          {t("refundTitle")}
        </Button>
      ) : null}
      <Dialog open={Boolean(open)} onOpenChange={(o) => !o && setOpen(null)}>
        {open ? (
          <DialogContent title={open === "refund" ? t("refundTitle") : trialing ? t("cancelTrialTitle") : t("cancelTitle")} closeLabel="×">
            <p className="text-muted-foreground">
              {open === "refund" ? t("refundBody") : trialing ? t("cancelBodyTrial", { date: accessUntil }) : t("cancelBodyActive", { date: accessUntil })}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
              <Button variant="destructive" disabled={pending} onClick={() => run(open === "refund")}>
                {open === "refund" ? t("confirmRefund") : t("confirmCancel")}
              </Button>
              <Button variant="outline" onClick={() => setOpen(null)}>
                {t("keep")}
              </Button>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </>
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
