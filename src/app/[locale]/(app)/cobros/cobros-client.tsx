"use client";
import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import QRCode from "qrcode";
import { Banknote, Copy, Eye, EyeOff, MessageCircle, QrCode, CircleCheck, TriangleAlert, Clock } from "@/components/icons";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, Notice } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { StatusBadge, receivableTone } from "@/components/ui/status-badge";
import { useOffline } from "@/components/app/offline-provider";
import { assumeReceivableAction, markChargedAction, writeOffAction } from "@/app/actions";
import { centsToInput, formatBRL, parseMoneyInput } from "@/lib/money";
import { todayISO } from "@/lib/dates";
import { chargeMessage } from "@/lib/wa-templates";
import { cn, waLink } from "@/lib/utils";

export function AgingBars({ buckets, total }: { buckets: { ok: number; watch: number; late: number; critical: number }; total: number }) {
  const t = useTranslations("cobros");
  const locale = useLocale();
  const rows = [
    ["ok", t("bucketOk"), buckets.ok, "bg-aging-ok", "text-paid-fg"],
    ["watch", t("bucketWatch"), buckets.watch, "bg-aging-watch", "text-foreground"],
    ["late", t("bucketLate"), buckets.late, "bg-aging-late", "text-overdue-calote-fg"],
    ["critical", t("bucketCritical"), buckets.critical, "bg-aging-late", "text-overdue-calote-fg"],
  ] as const;
  return (
    <div className="mt-4">
      <p className="font-semibold">{t("aging")}</p>
      <ul className="mt-2 space-y-2">
        {rows.map(([k, label, v, bar, text]) => (
          <li key={k} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3">
            <span className={cn("font-semibold", text)}>{label}</span>
            <span className="h-3.5 overflow-hidden rounded-sm border border-border bg-muted" aria-hidden="true">
              <span className={cn("block h-full", bar, k === "critical" && "bg-[repeating-linear-gradient(135deg,var(--aging-late)_0_6px,var(--overdue-calote-fg)_6px_9px)]")} style={{ width: `${total ? Math.round((v / total) * 100) : 0}%` }} />
            </span>
            <span className="tabular-money min-w-24 text-right font-semibold">{formatBRL(v, locale)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface Item {
  id: string;
  clientName: string;
  clientPhone: string | null;
  clientLocale: "es" | "pt-BR";
  reference: string | null;
  batchId: string;
  status: string;
  amountCents: number;
  openCents: number;
  days: number;
  issuedOn: string;
  proofUrl: string;
  viewed: boolean;
  confirmed: boolean;
  disputed: boolean;
  payerClaimed: boolean;
  pix: string | null;
  pixError: boolean;
}

function useErr() {
  const t = useTranslations();
  return (code?: string) => (code && t.has(`errors.${code}`) ? t(`errors.${code}` as "errors.server_error") : t("common.errorGeneric"));
}

export function ReceivableList({ items, workshopName, canWrite, canMarkPaid }: { items: Item[]; workshopName: string; canWrite: boolean; canMarkPaid: boolean }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const errMsg = useErr();
  const [payFor, setPayFor] = React.useState<Item | null>(null);
  const [qrFor, setQrFor] = React.useState<Item | null>(null);
  const [pending, start] = React.useTransition();
  void workshopName;

  return (
    <>
      <ul className="grid items-start gap-4 xl:grid-cols-2">
        {items.map((i) => {
          const tone = i.days > 15 ? "late" : i.days > 7 ? "watch" : "ok";
          const msg = chargeMessage(i.clientLocale, { client: i.clientName, amountCents: i.openCents, deliveredOn: i.issuedOn, days: i.days, pix: i.pix, url: i.proofUrl });
          return (
            <li key={i.id}>
              <Card className={cn("overflow-hidden p-0", tone === "late" && "border-aging-late-border")}>
                <div
                  className={cn(
                    "flex items-center justify-between gap-2 border-b px-4 py-2 font-semibold",
                    tone === "ok" && "border-aging-ok-border bg-aging-ok-bg text-paid-fg",
                    tone === "watch" && "border-aging-watch-border bg-aging-watch-bg text-awaiting-confirmation-fg",
                    tone === "late" && "border-aging-late-border bg-aging-late-bg text-overdue-calote-fg",
                  )}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {tone === "late" ? <TriangleAlert aria-hidden="true" className="size-4" /> : <Clock aria-hidden="true" className="size-4" />}
                    {t("cobros.daysOpen", { days: t("common.days", { count: i.days }) })}
                    {tone === "late" ? <span className="sr-only"> · {t("status.overdue")}</span> : null}
                  </span>
                  <StatusBadge tone={receivableTone[i.status]?.tone ?? "neutral"} label={t(`status.receivable.${i.status}` as "status.receivable.open")} className="bg-card" />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-lg font-bold">{i.clientName}</p>
                      <Link href={`/lotes/${i.batchId}`} className="text-muted-foreground underline-offset-4 hover:underline">
                        {i.reference ? `${t("common.reference")} ${i.reference}` : t("batch.noRef")} · {i.issuedOn}
                      </Link>
                    </div>
                    <div className="text-right">
                      <p className="tabular-money text-2xl font-bold">{formatBRL(i.openCents, locale)}</p>
                      {i.openCents !== i.amountCents ? <p className="tabular-money text-muted-foreground">/ {formatBRL(i.amountCents, locale)}</p> : null}
                    </div>
                  </div>
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
                    <span>{t("cobros.proofStatus")}:</span>
                    <span className="inline-flex items-center gap-1">
                      {i.viewed ? <Eye aria-hidden="true" className="size-4" /> : <EyeOff aria-hidden="true" className="size-4" />}
                      {i.viewed ? t("cobros.viewed") : t("cobros.notViewed")}
                    </span>
                    {i.confirmed ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-paid-fg">
                        <CircleCheck aria-hidden="true" className="size-4" /> {t("cobros.confirmed")}
                      </span>
                    ) : null}
                    {i.disputed ? <span className="font-semibold text-rework-fg">{t("cobros.disputed")}</span> : null}
                  </p>
                  {i.payerClaimed ? (
                    <Notice tone="awaiting" className="mt-2" icon={<Banknote />}>
                      <p>{t("delivery.payerClaimed")}</p>
                    </Notice>
                  ) : null}
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <a
                      href={waLink(i.clientPhone, msg)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => {
                        start(async () => {
                          await markChargedAction(i.id);
                        });
                        toast.success(t("cobros.chargeSent", { name: i.clientName, amount: formatBRL(i.openCents, locale), days: t("common.days", { count: i.days }) }));
                      }}
                      className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg border border-paid-solid bg-paid-solid px-4 text-lg font-semibold text-paid-solid-fg"
                    >
                      <MessageCircle aria-hidden="true" className="size-5" /> {t("cobros.charge")}
                    </a>
                    {canMarkPaid ? (
                      <Button size="lg" variant="outline" onClick={() => setPayFor(i)}>
                        <Banknote aria-hidden="true" /> {t("cobros.registerPayment")}
                      </Button>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {i.pix ? (
                      <>
                        <Button
                          variant="ghost"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(i.pix!);
                              toast.success(t("cobros.pixCopied"));
                            } catch {
                              window.prompt(t("cobros.pixCopy"), i.pix!);
                            }
                          }}
                        >
                          <Copy aria-hidden="true" /> {t("cobros.pixCopy")}
                        </Button>
                        <Button variant="ghost" onClick={() => setQrFor(i)}>
                          <QrCode aria-hidden="true" /> {t("cobros.pixQr")}
                        </Button>
                      </>
                    ) : i.pixError ? (
                      <p className="text-destructive">{t("cobros.pixError")}</p>
                    ) : null}
                    {canWrite && i.status === "awaiting_confirmation" && i.days >= 3 ? (
                      <Button
                        variant="ghost"
                        disabled={pending}
                        onClick={() =>
                          start(async () => {
                            const r = await assumeReceivableAction(i.id);
                            if (!r.ok) toast.error(errMsg(r.error));
                            else router.refresh();
                          })
                        }
                      >
                        {t("cobros.assume")}
                      </Button>
                    ) : null}
                    {canWrite ? (
                      <Button
                        variant="ghost"
                        className="text-destructive sm:ml-auto"
                        disabled={pending}
                        onClick={() => {
                          if (!window.confirm(t("cobros.writeOffConfirm"))) return;
                          start(async () => {
                            const r = await writeOffAction(i.id);
                            if (!r.ok) toast.error(errMsg(r.error));
                            else router.refresh();
                          });
                        }}
                      >
                        {t("cobros.writeOff")}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <Dialog open={Boolean(payFor)} onOpenChange={(o) => !o && setPayFor(null)}>
        {payFor ? (
          <DialogContent title={t("cobros.paymentTitle", { name: payFor.clientName })} side="bottom" closeLabel={t("common.close")}>
            <PaymentForm item={payFor} onDone={() => setPayFor(null)} />
          </DialogContent>
        ) : null}
      </Dialog>
      <Dialog open={Boolean(qrFor)} onOpenChange={(o) => !o && setQrFor(null)}>
        {qrFor?.pix ? (
          <DialogContent title={t("cobros.pixQr")} description={`${qrFor.clientName} · ${formatBRL(qrFor.openCents, locale)}`} closeLabel={t("common.close")}>
            <PixQr code={qrFor.pix} />
          </DialogContent>
        ) : null}
      </Dialog>
    </>
  );
}

export function PixQr({ code }: { code: string }) {
  const t = useTranslations("cobros");
  const [svg, setSvg] = React.useState<string>("");
  React.useEffect(() => {
    // QR em preto/branco puros é exigência de leitura dos apps de banco (fora da paleta por função)
    QRCode.toString(code, { type: "svg", margin: 2, errorCorrectionLevel: "M" }).then(setSvg).catch(() => setSvg(""));
  }, [code]);
  return (
    <div className="space-y-3">
      <div className="mx-auto w-full max-w-64 rounded-lg border border-border bg-card p-2" role="img" aria-label={t("pixQr")} dangerouslySetInnerHTML={{ __html: svg }} />
      <p className="break-all rounded-lg bg-muted p-3 font-mono text-sm">{code}</p>
    </div>
  );
}

function PaymentForm({ item, onDone }: { item: Item; onDone: () => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const errMsg = useErr();
  const { submit } = useOffline();
  const [amount, setAmount] = React.useState(centsToInput(item.openCents));
  const [date, setDate] = React.useState(todayISO());
  const [method, setMethod] = React.useState<"pix" | "cash" | "other">("pix");
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
        const r = await submit("payment.create", { receivableId: item.id, amountCents: c, paidOn: date, method }).catch(() => ({ queued: false, ok: false, error: "server_error" }));
        setBusy(false);
        if (!r.ok) return setError(errMsg(r.error));
        toast.success(r.queued ? t("common.savedOffline") : t("cobros.paymentSaved"));
        onDone();
      }}
    >
      <Field id="pa" label={t("cobros.paymentAmount")} hint={t("cobros.paymentFull", { amount: formatBRL(item.openCents, locale) })} error={error}>
        {(a) => <Input {...a} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))} className="tabular-money min-h-14 text-2xl font-bold" />}
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field id="pd" label={t("cobros.paymentDate")}>
          {(a) => <Input {...a} type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />}
        </Field>
        <Field id="pm" label={t("cobros.paymentMethod")}>
          {(a) => (
            <Select {...a} value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
              <option value="pix">{t("cobros.methodPix")}</option>
              <option value="cash">{t("cobros.methodCash")}</option>
              <option value="other">{t("cobros.methodOther")}</option>
            </Select>
          )}
        </Field>
      </div>
      <Button type="submit" size="lg" block disabled={busy}>
        {busy ? t("common.saving") : t("cobros.registerPayment")}
      </Button>
    </form>
  );
}
