"use client";
import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Copy, ExternalLink, Eye, EyeOff, Link2Off, MessageCircle, Scissors, Truck, Ban, RotateCcw, CircleCheck, TriangleAlert, Banknote } from "@/components/icons";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, Notice } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { PhotoPicker, type PickedPhoto } from "@/components/app/photo-picker";
import { StatusBadge } from "@/components/ui/status-badge";
import { registerDeliveryAction, revokeProofAction, setBatchStatusAction, upsertOperationAction } from "@/app/actions";
import { uploadPhoto } from "@/lib/offline/queue";
import { centsToInput, formatBRL, parseMoneyInput } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import { proofMessage } from "@/lib/wa-templates";
import { waLink } from "@/lib/utils";
import { verificationCodeShort } from "./verification";

const MACHINES = ["recta", "overlock", "collareta", "interlock", "other"] as const;

/** O que é preciso para montar a mensagem do comprovante logo depois de gerá-lo. */
export type ShareInfo = { baseUrl: string; workshopName: string; client: { name: string; phone: string | null; locale: "es" | "pt-BR" } | null; reference: string | null };

function useErr() {
  const t = useTranslations();
  return (code?: string) => (code && t.has(`errors.${code}`) ? t(`errors.${code}` as "errors.server_error") : t("common.errorGeneric"));
}

export function BatchActions({
  batchId,
  status,
  remaining,
  unitPriceCents,
  sizeGrid,
  canWrite,
  share,
}: {
  share: ShareInfo;
  batchId: string;
  status: string;
  remaining: number;
  unitPriceCents: number;
  sizeGrid: Record<string, number> | null;
  canWrite: boolean;
}) {
  const t = useTranslations();
  const router = useRouter();
  const errMsg = useErr();
  const [pending, start] = React.useTransition();
  const [open, setOpen] = React.useState(false);

  const change = (s: string) =>
    start(async () => {
      const r = await setBatchStatusAction(batchId, s);
      if (!r.ok) toast.error(errMsg(r.error));
      else router.refresh();
    });

  const showDelivery = remaining > 0 && status !== "canceled" && status !== "closed";
  const showCancel = status !== "canceled" && status !== "closed" && status !== "delivered";
  if (!canWrite || (!showDelivery && !showCancel && !open)) return null;
  return (
    <Card className="anim-rise p-5">
      <h2 className="sr-only">{t("batch.actions")}</h2>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {status === "received" ? (
          <Button variant="outline" onClick={() => change("in_production")} disabled={pending}>
            <Scissors aria-hidden="true" /> {t("batch.toProduction")}
          </Button>
        ) : null}
        {status === "in_production" ? (
          <Button variant="outline" onClick={() => change("ready")} disabled={pending}>
            <Check aria-hidden="true" /> {t("batch.toReady")}
          </Button>
        ) : null}
        {showDelivery || open ? (
          <Dialog open={open} onOpenChange={setOpen}>
            {showDelivery ? (
              <Button size="lg" onClick={() => setOpen(true)} className="sm:order-first">
                <Truck aria-hidden="true" /> {t("batch.registerDelivery")}
              </Button>
            ) : null}
            <DialogContent title={t("delivery.title")} description={t("delivery.lead")} side="bottom" closeLabel={t("common.close")}>
              <DeliveryForm batchId={batchId} max={Math.max(1, remaining)} unitPriceCents={unitPriceCents} sizeGrid={sizeGrid} share={share} onDone={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        ) : null}
        {status !== "canceled" && status !== "closed" && status !== "delivered" ? (
          <Button
            variant="ghost"
            onClick={() => {
              if (window.confirm(t("batch.cancelBatch") + "?")) change("canceled");
            }}
            disabled={pending}
            className="sm:ml-auto"
          >
            <Ban aria-hidden="true" /> {t("batch.cancelBatch")}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

function DeliveryForm({
  batchId,
  max,
  unitPriceCents,
  sizeGrid,
  onDone,
  previousProofId,
  share,
}: {
  batchId: string;
  max: number;
  unitPriceCents: number;
  sizeGrid: Record<string, number> | null;
  onDone: () => void;
  previousProofId?: string;
  share: ShareInfo;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const errMsg = useErr();
  const [qty, setQty] = React.useState(String(max));
  const [discount, setDiscount] = React.useState("");
  const [note, setNote] = React.useState("");
  const [dueOn, setDueOn] = React.useState("");
  const [photos, setPhotos] = React.useState<PickedPhoto[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [created, setCreated] = React.useState<{ token: string; quantity: number; amountCents: number; grid: Record<string, number> | null } | null>(null);
  const q = Number(qty) || 0;
  const discountCents = parseMoneyInput(discount) ?? 0;
  const amount = q * unitPriceCents - discountCents;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!(q > 0)) return setError(t("common.required"));
    setBusy(true);
    setError(null);
    try {
      const photoIds: string[] = [];
      for (const p of photos) photoIds.push(await uploadPhoto(p.blob, p.width, p.height));
      const fullGrid = sizeGrid && q === Object.values(sizeGrid).reduce((a, b) => a + b, 0) ? sizeGrid : undefined;
      const r = await registerDeliveryAction(
        { batchId, quantity: q, discountCents, note: note || undefined, photoIds, dueOn: dueOn || undefined, sizeGrid: fullGrid },
        previousProofId,
      );
      if (!r.ok) {
        setError(errMsg(r.error));
        setBusy(false);
        return;
      }
      setCreated({ token: r.data!.token, quantity: q, amountCents: amount, grid: fullGrid ?? null });
      setBusy(false);
      router.refresh();
    } catch {
      setError(t("common.errorGeneric"));
      setBusy(false);
    }
  }

  if (created) return <ShareStep share={share} {...created} onDone={onDone} />;

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field id="dq" label={t("delivery.quantity")} hint={t("delivery.partial")} error={error}>
        {(a) => <Input {...a} inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))} className="tabular-money min-h-14 text-2xl font-bold" />}
      </Field>
      <Field id="dd" label={t("delivery.discount")} optional={t("common.optional")}>
        {(a) => <Input {...a} inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value.replace(/[^\d.,]/g, ""))} className="tabular-money" />}
      </Field>
      <Field id="ddue" label={t("delivery.dueOn")} optional={t("common.optional")}>
        {(a) => <Input {...a} type="date" value={dueOn} onChange={(e) => setDueOn(e.target.value)} />}
      </Field>
      <Field id="dn" label={t("delivery.note")} optional={t("common.optional")}>
        {(a) => <Textarea {...a} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />}
      </Field>
      <PhotoPicker photos={photos} onChange={setPhotos} max={5} label={t("delivery.photos")} />
      <p aria-live="polite" className="rounded-lg bg-secondary px-3 py-2.5 text-lg font-bold text-secondary-foreground">
        {t("delivery.amount", { amount: formatBRL(Math.max(0, amount), locale) })}
      </p>
      <Button type="submit" size="lg" block disabled={busy}>
        {busy ? t("delivery.submitting") : t("delivery.submit")}
      </Button>
    </form>
  );
}

function ShareStep({ share, token, quantity, amountCents, grid, onDone }: { share: ShareInfo; token: string; quantity: number; amountCents: number; grid: Record<string, number> | null; onDone: () => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const clientLocale = share.client?.locale ?? "pt-BR";
  const url = `${share.baseUrl}/${clientLocale}/c/${token}`;
  const msg = proofMessage(clientLocale, { client: share.client?.name ?? "", workshop: share.workshopName, quantity, reference: share.reference, grid, amountCents, url });
  return (
    <div className="space-y-5" role="status">
      <div className="flex items-start gap-3 rounded-2xl bg-mint-200/50 p-4">
        <CircleCheck aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-paid-fg" />
        <div>
          <p className="font-medium">{t("delivery.created")}</p>
          <p className="text-sm text-muted-foreground">{t("delivery.nextStep", { amount: formatBRL(amountCents, locale) })}</p>
        </div>
      </div>
      <a
        href={waLink(share.client?.phone ?? null, msg)}
        target="_blank"
        rel="noreferrer"
        onClick={() => toast.success(t("delivery.sentHint"))}
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-lg border border-paid-solid bg-paid-solid px-4 text-lg font-semibold text-paid-solid-fg"
      >
        <MessageCircle aria-hidden="true" className="size-5" /> {t("delivery.sendWhatsapp")}
      </a>
      {!share.client?.phone ? <p className="text-sm text-muted-foreground">{t("delivery.noPhone")}</p> : null}
      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          variant="outline"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              toast.success(t("delivery.linkCopied"));
            } catch {
              window.prompt(t("delivery.copyLink"), url);
            }
          }}
        >
          <Copy aria-hidden="true" /> {t("delivery.copyLink")}
        </Button>
        <Button variant="ghost" onClick={onDone}>
          {t("delivery.later")}
        </Button>
      </div>
    </div>
  );
}

export function OperationsEditor({ batchId, ops, canWrite }: { batchId: string; ops: { id: string; machine: string; rate: number; produced: number }[]; canWrite: boolean }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const errMsg = useErr();
  const [machine, setMachine] = React.useState<string>(MACHINES.find((m) => !ops.some((o) => o.machine === m)) ?? "recta");
  const [rate, setRate] = React.useState("");
  const [pending, start] = React.useTransition();

  return (
    <Card className="anim-rise p-5">
      <h2 className="font-display text-lg">{t("batch.operationsTitle")}</h2>
      {ops.length ? (
        <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
          {ops.map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <span className="font-semibold">{t(`machines.${o.machine}` as "machines.recta")}</span>
              <span className="text-muted-foreground tabular-money">{t("common.pieces", { count: o.produced })}</span>
              <span className="tabular-money font-semibold">
                {formatBRL(o.rate, locale)} <span className="font-normal text-muted-foreground">{t("common.perPiece")}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-muted-foreground">{t("batch.operationsHint")}</p>
      )}
      {canWrite ? (
        <form
          className="mt-4 grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_9rem_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            const c = parseMoneyInput(rate);
            if (!c) return;
            start(async () => {
              const r = await upsertOperationAction(batchId, machine, c);
              if (!r.ok) toast.error(errMsg(r.error));
              else {
                setRate("");
                router.refresh();
              }
            });
          }}
        >
          <Field id="op-machine" label={t("batch.machine")}>
            {(a) => (
              <Select {...a} value={machine} onChange={(e) => setMachine(e.target.value)}>
                {MACHINES.map((m) => (
                  <option key={m} value={m}>
                    {t(`machines.${m}`)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field id="op-rate" label={t("batch.rate")}>
            {(a) => <Input {...a} inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value.replace(/[^\d.,]/g, ""))} className="tabular-money" placeholder={centsToInput(40)} />}
          </Field>
          <Button type="submit" variant="outline" disabled={pending}>
            {t("batch.addOperation")}
          </Button>
        </form>
      ) : null}
    </Card>
  );
}

interface ProofView {
  id: string;
  token: string;
  version: number;
  quantity: number;
  amountCents: number;
  sizeGrid: Record<string, number> | null;
  createdAt: string;
  viewedAt: string | null;
  confirmedAt: string | null;
  confirmedName: string | null;
  disputedAt: string | null;
  disputedQuantity: number | null;
  disputedComment: string | null;
  revokedAt: string | null;
  sha: string;
  payerClaimed: boolean;
  batchId: string;
}

export function DeliveryList({
  proofs,
  baseUrl,
  workshopName,
  client,
  reference,
}: {
  proofs: ProofView[];
  baseUrl: string;
  workshopName: string;
  client: { name: string; phone: string | null; locale: "es" | "pt-BR" } | null;
  reference: string | null;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const errMsg = useErr();
  const [pending, start] = React.useTransition();
  const [fixFor, setFixFor] = React.useState<ProofView | null>(null);

  if (!proofs.length) return <p className="rounded-2xl border border-dashed border-ink/20 bg-card px-4 py-8 text-center text-muted-foreground">{t("batch.noDeliveries")}</p>;

  return (
    <ul className="space-y-3">
      {proofs.map((p) => {
        const clientLocale = client?.locale ?? "pt-BR";
        const url = `${baseUrl}/${clientLocale}/c/${p.token}`;
        const msg = proofMessage(clientLocale, {
          client: client?.name ?? "",
          workshop: workshopName,
          quantity: p.quantity,
          reference,
          grid: p.sizeGrid,
          amountCents: p.amountCents,
          url,
        });
        const viewed = p.viewedAt ? formatDateTime(new Date(p.viewedAt), locale) : null;
        const conf = p.confirmedAt ? formatDateTime(new Date(p.confirmedAt), locale) : null;
        return (
          <li key={p.id}>
            <Card className={p.revokedAt ? "p-4 opacity-100 [&]:bg-muted" : "p-4"}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">
                  {t("delivery.version", { v: p.version })} · <span className="tabular-money">{t("common.pieces", { count: p.quantity })}</span> ·{" "}
                  <span className="tabular-money">{formatBRL(p.amountCents, locale)}</span>
                </p>
                {p.revokedAt ? (
                  <StatusBadge tone="neutral" icon={Link2Off} label={t("delivery.revoked")} />
                ) : p.confirmedAt ? (
                  <StatusBadge tone="paid" icon={CircleCheck} label={t("cobros.confirmed")} />
                ) : p.disputedAt ? (
                  <StatusBadge tone="rework" label={t("cobros.disputed")} />
                ) : (
                  <StatusBadge tone="awaiting-confirmation" label={t("status.awaiting_confirmation")} />
                )}
              </div>
              <p className="mt-2 flex items-center gap-2 text-muted-foreground">
                {viewed ? <Eye aria-hidden="true" className="size-4" /> : <EyeOff aria-hidden="true" className="size-4" />}
                {viewed ? t("delivery.viewedAt", viewed) : t("delivery.notViewed")}
              </p>
              {conf ? (
                <p className="mt-1 inline-flex items-start gap-1.5 font-semibold text-paid-fg">
                  <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  {t("delivery.confirmedBy", { name: p.confirmedName ?? "", ...conf })}
                </p>
              ) : null}
              {p.disputedAt ? (
                <Notice tone="warning" className="mt-2" icon={<TriangleAlert />}>
                  <p>{t("delivery.disputed", { quantity: p.disputedQuantity ?? 0, comment: p.disputedComment ?? "" })}</p>
                </Notice>
              ) : null}
              {p.payerClaimed ? (
                <Notice tone="awaiting" className="mt-2" icon={<Banknote />}>
                  <p>{t("delivery.payerClaimed")}</p>
                </Notice>
              ) : null}
              <p className="mt-2 font-mono text-sm text-muted-foreground">
                {t("common.verificationCode")}: {verificationCodeShort(p.sha)}
              </p>
              {!p.revokedAt ? (
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {!p.confirmedAt ? (
                    <a href={waLink(client?.phone, msg)} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-paid-solid bg-paid-solid px-4 font-semibold text-paid-solid-fg">
                      <MessageCircle aria-hidden="true" className="size-5" /> {t("delivery.sendWhatsapp")}
                    </a>
                  ) : null}
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(url);
                        toast.success(t("common.copied"));
                      } catch {
                        window.prompt(t("delivery.copyLink"), url);
                      }
                    }}
                  >
                    <Copy aria-hidden="true" /> {t("delivery.copyLink")}
                  </Button>
                  <a href={`/${clientLocale}/c/${p.token}`} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-[1.5px] border-input bg-card px-4 font-semibold">
                    <ExternalLink aria-hidden="true" className="size-5" /> {t("delivery.openLink")}
                  </a>
                  {!p.confirmedAt ? (
                    <Button variant="ghost" onClick={() => setFixFor(p)}>
                      <RotateCcw aria-hidden="true" /> {t("delivery.newVersion")}
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    disabled={pending}
                    className="text-destructive sm:ml-auto"
                    onClick={() => {
                      if (!window.confirm(t("delivery.revokeConfirm"))) return;
                      start(async () => {
                        const r = await revokeProofAction(p.id);
                        if (!r.ok) toast.error(errMsg(r.error));
                        else router.refresh();
                      });
                    }}
                  >
                    <Link2Off aria-hidden="true" /> {t("delivery.revoke")}
                  </Button>
                </div>
              ) : null}
            </Card>
          </li>
        );
      })}
      <Dialog open={Boolean(fixFor)} onOpenChange={(o) => !o && setFixFor(null)}>
        {fixFor ? (
          <DialogContent title={t("delivery.newVersion")} description={t("delivery.lead")} side="bottom" closeLabel={t("common.close")}>
            <DeliveryForm
              batchId={fixFor.batchId}
              max={fixFor.disputedQuantity ?? fixFor.quantity}
              unitPriceCents={Math.round(fixFor.amountCents / Math.max(1, fixFor.quantity))}
              sizeGrid={null}
              previousProofId={fixFor.id}
              share={{ baseUrl, workshopName, client, reference }}
              onDone={() => setFixFor(null)}
            />
          </DialogContent>
        ) : null}
      </Dialog>
    </ul>
  );
}
