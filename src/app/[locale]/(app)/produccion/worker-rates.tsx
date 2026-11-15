"use client";
/** Folha por peça: valor por peça de cada costureira, por modelo e/ou máquina (vale sobre o valor da operação do corte). */
import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Banknote, Trash2 } from "@/components/icons";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { deleteWorkerRateAction, setWorkerRateAction } from "@/app/module-actions";
import { formatBRL, parseMoneyInput } from "@/lib/money";

const MACHINES = ["recta", "overlock", "collareta", "interlock", "other"] as const;
type Machine = (typeof MACHINES)[number];

export type WorkerRateRow = { id: string; machine: string | null; reference: string | null; cents: number };

export function WorkerRates({ workerId, workerName, rates, canWrite }: { workerId: string; workerName: string; rates: WorkerRateRow[]; canWrite: boolean }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [machine, setMachine] = React.useState<"" | Machine>("");
  const [reference, setReference] = React.useState("");
  const [rate, setRate] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  const err = (code?: string) => (code && t.has(`errors.${code}`) ? t(`errors.${code}` as "errors.server_error") : t("common.errorGeneric"));
  const label = (r: WorkerRateRow) =>
    [r.reference ? `${t("common.reference")} ${r.reference}` : null, r.machine ? t(`machines.${r.machine}` as "machines.recta") : null].filter(Boolean).join(" · ") ||
    t("workerRates.anyWork");

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} aria-label={t("workerRates.open", { name: workerName })}>
        <Banknote aria-hidden="true" />
        <span className="hidden sm:inline">{t("workerRates.button")}</span>
        {rates.length ? <span className="tabular-money text-muted-foreground">{rates.length}</span> : null}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        {open ? (
          <DialogContent title={t("workerRates.title", { name: workerName })} side="bottom" closeLabel={t("common.close")}>
            <p className="text-sm text-muted-foreground">{t("workerRates.lead")}</p>
            {rates.length ? (
              <ul className="mt-4 divide-y divide-border rounded-2xl border border-ink/10">
                {rates.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="min-w-0 flex-1 truncate">{label(r)}</span>
                    <span className="font-semibold tabular-money">{formatBRL(r.cents, locale)}</span>
                    {canWrite ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`${t("workerRates.remove")}: ${label(r)}`}
                        disabled={pending}
                        onClick={() =>
                          start(async () => {
                            const res = await deleteWorkerRateAction(r.id);
                            if (!res.ok) toast.error(err(res.error));
                            else router.refresh();
                          })
                        }
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-2xl bg-mint-50 px-4 py-3 text-sm">{t("workerRates.empty")}</p>
            )}

            {canWrite ? (
              <form
                className="mt-5 space-y-4"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  const cents = parseMoneyInput(rate);
                  if (!cents) return setError(t("workerRates.rateRequired"));
                  setError(null);
                  start(async () => {
                    const res = await setWorkerRateAction({ workerId, machine: machine || null, reference: reference || null, pieceRateCents: cents });
                    if (!res.ok) return setError(err(res.error));
                    toast.success(t("workerRates.saved"));
                    setRate("");
                    setReference("");
                    setMachine("");
                    router.refresh();
                  });
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field id={`wr-ref-${workerId}`} label={t("workerRates.reference")} optional={t("common.optional")}>
                    {(a) => <Input {...a} value={reference} onChange={(e) => setReference(e.target.value)} maxLength={80} autoComplete="off" />}
                  </Field>
                  <Field id={`wr-m-${workerId}`} label={t("workerRates.machine")} optional={t("common.optional")}>
                    {(a) => (
                      <Select {...a} value={machine} onChange={(e) => setMachine(e.target.value as "" | Machine)}>
                        <option value="">{t("workerRates.anyMachine")}</option>
                        {MACHINES.map((m) => (
                          <option key={m} value={m}>
                            {t(`machines.${m}` as "machines.recta")}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Field>
                </div>
                <Field id={`wr-v-${workerId}`} label={t("workerRates.rate")} error={error}>
                  {(a) => <Input {...a} inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="0,50" className="tabular-money" />}
                </Field>
                <Button type="submit" size="lg" block disabled={pending}>
                  {pending ? t("common.saving") : t("workerRates.save")}
                </Button>
              </form>
            ) : null}
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}
