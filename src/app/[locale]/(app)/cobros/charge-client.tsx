"use client";
/**
 * Cobrar por cliente (fechamento do período): junta as entregas em aberto de um cliente,
 * gera um Pix (QR + copia e cola) do total e a mensagem de lembrete pronta (gentil ou firme)
 * para a oficina mandar pelo próprio WhatsApp. Nada é enviado sozinho.
 */
import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Banknote, Copy, Lock, MessageCircle, QrCode, Sparkles } from "@/components/icons";
import { Link, useRouter } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { markChargedManyAction, payClientChargeAction } from "@/app/module-actions";
import { buildPixBrCode } from "@/lib/pix-brcode";
import { chargePeriodRange, daysBetween, todayISO, type ChargePeriod } from "@/lib/dates";
import { formatBRL, parseMoneyInput, centsToInput } from "@/lib/money";
import { reminderMessage, type ReminderTone } from "@/lib/wa-templates";
import { cn, waLink } from "@/lib/utils";
import { PixQr } from "./cobros-client";

export type ChargeItem = {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string | null;
  clientLocale: "es" | "pt-BR";
  reference: string | null;
  quantity: number | null;
  openCents: number;
  issuedOnISO: string;
  issuedOn: string;
  proofUrl: string;
  awaiting: boolean;
};

type PixConfig = { key: string; merchantName: string; city: string } | null;

const PERIODS: ChargePeriod[] = ["week", "fortnight", "month", "all"];

export function ClientCharges({ items, workshopName, pix, canMarkPaid, locked = false }: { items: ChargeItem[]; workshopName: string; pix: PixConfig; canMarkPaid: boolean; locked?: boolean }) {
  const t = useTranslations("charge");
  const locale = useLocale();
  const [openFor, setOpenFor] = React.useState<string | null>(null);

  const groups = React.useMemo(() => {
    const map = new Map<string, ChargeItem[]>();
    for (const i of items) map.set(i.clientId, [...(map.get(i.clientId) ?? []), i]);
    return [...map.entries()]
      .map(([clientId, list]) => ({ clientId, name: list[0]!.clientName, list, total: list.reduce((a, i) => a + i.openCents, 0) }))
      .filter((g) => g.list.length > 0)
      .sort((a, b) => b.total - a.total);
  }, [items]);

  if (!groups.length) return null;
  const current = groups.find((g) => g.clientId === openFor) ?? null;

  // plano grátis: mostra o que daria para cobrar de uma vez, com cadeado
  if (locked) {
    const total = groups.reduce((a, g) => a + g.total, 0);
    return (
      <section aria-labelledby="sec-charge" className="flex flex-wrap items-center gap-4 rounded-3xl border border-ink/[0.06] bg-card p-5 shadow-soft">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Lock aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="sec-charge" className="font-medium">
            {t("title")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("lockedTeaser", { count: groups.length, amount: formatBRL(total, locale) })}</p>
        </div>
        <Link href="/assinar" className={buttonVariants({ size: "sm" })}>
          <Sparkles aria-hidden="true" /> {t("unlock")}
        </Link>
      </section>
    );
  }

  return (
    <section aria-labelledby="sec-charge" className="space-y-3">
      <div>
        <h2 id="sec-charge" className="font-medium">
          {t("title")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("lead")}</p>
      </div>
      <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {groups.map((g) => (
          <li key={g.clientId} className="flex items-center gap-3 rounded-2xl border border-ink/[0.06] bg-card px-4 py-3 shadow-soft">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{g.name}</p>
              <p className="text-sm text-muted-foreground">
                {t("deliveries", { count: g.list.length })} · <span className="tabular-money">{formatBRL(g.total, locale)}</span>
              </p>
            </div>
            <Button variant="secondary" onClick={() => setOpenFor(g.clientId)}>
              <MessageCircle aria-hidden="true" />
              {t("open")}
            </Button>
          </li>
        ))}
      </ul>
      <Dialog open={Boolean(current)} onOpenChange={(o) => !o && setOpenFor(null)}>
        {current ? (
          <DialogContent title={t("dialogTitle", { name: current.name })} side="bottom" closeLabel={t("close")}>
            <ChargeDialog items={current.list} workshopName={workshopName} pix={pix} canMarkPaid={canMarkPaid} onDone={() => setOpenFor(null)} />
          </DialogContent>
        ) : null}
      </Dialog>
    </section>
  );
}

function ChargeDialog({ items, workshopName, pix, canMarkPaid, onDone }: { items: ChargeItem[]; workshopName: string; pix: PixConfig; canMarkPaid: boolean; onDone: () => void }) {
  const t = useTranslations("charge");
  const te = useTranslations("errors");
  const locale = useLocale();
  const router = useRouter();
  const today = todayISO();
  const first = items[0]!;
  const [period, setPeriod] = React.useState<ChargePeriod>("all");
  const range = chargePeriodRange(period, today);
  const inPeriod = items.filter((i) => (!range.from || i.issuedOnISO >= range.from) && i.issuedOnISO <= range.to);
  const [picked, setPicked] = React.useState<Set<string>>(() => new Set(items.map((i) => i.id)));
  const selected = inPeriod.filter((i) => picked.has(i.id));
  const total = selected.reduce((a, i) => a + i.openCents, 0);
  const [tone, setTone] = React.useState<ReminderTone>("gentle");
  const [showQr, setShowQr] = React.useState(false);
  const [paying, setPaying] = React.useState(false);
  const [amount, setAmount] = React.useState("");
  const [paidOn, setPaidOn] = React.useState(today);
  const [pending, start] = React.useTransition();

  let pixCode: string | null = null;
  if (pix && total > 0) {
    try {
      pixCode = buildPixBrCode({ key: pix.key, merchantName: pix.merchantName, merchantCity: pix.city, amountCents: total, txid: "CRP" + selected.map((i) => i.id.slice(0, 4)).join("").slice(0, 22) });
    } catch {
      pixCode = null;
    }
  }
  const oldest = selected.reduce((a, i) => Math.max(a, daysBetween(i.issuedOnISO, today)), 0);
  const message = selected.length
    ? reminderMessage(first.clientLocale, tone, {
        client: first.clientName,
        workshop: workshopName,
        items: selected.map((i) => ({ deliveredOn: i.issuedOn, quantity: i.quantity, reference: i.reference, amountCents: i.openCents, url: i.proofUrl })),
        totalCents: total,
        oldestDays: oldest,
        pix: pixCode,
      })
    : "";

  async function copy(text: string, ok: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(ok);
    } catch {
      window.prompt(t("copyFallback"), text);
    }
  }
  const markCharged = () => void markChargedManyAction(selected.map((i) => i.id));

  return (
    <div className="space-y-5">
      <Field id="charge-period" label={t("period")}>
        {(a) => (
          <Select {...a} value={period} onChange={(e) => setPeriod(e.target.value as ChargePeriod)}>
            {PERIODS.map((p) => (
              <option key={p} value={p}>
                {t(`periods.${p}`)}
              </option>
            ))}
          </Select>
        )}
      </Field>

      {inPeriod.length ? (
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-muted-foreground">{t("pick")}</legend>
          <ul className="divide-y divide-border rounded-2xl border border-ink/10">
            {inPeriod.map((i) => (
              <li key={i.id}>
                <label className="flex min-h-14 cursor-pointer items-center gap-3 px-4 py-2">
                  <input
                    type="checkbox"
                    className="size-5 accent-primary"
                    checked={picked.has(i.id)}
                    onChange={(e) =>
                      setPicked((s) => {
                        const n = new Set(s);
                        if (e.target.checked) n.add(i.id);
                        else n.delete(i.id);
                        return n;
                      })
                    }
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block">
                      {i.issuedOn}
                      {i.reference ? ` · ${t("ref", { ref: i.reference })}` : ""}
                      {i.quantity ? ` · ${t("pieces", { count: i.quantity })}` : ""}
                    </span>
                    {i.awaiting ? <span className="block text-xs text-awaiting-confirmation-fg">{t("awaiting")}</span> : null}
                  </span>
                  <span className="font-medium tabular-money">{formatBRL(i.openCents, locale)}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      ) : (
        <p className="rounded-2xl bg-mint-50 px-4 py-3 text-sm">{t("noneInPeriod")}</p>
      )}

      <div className="flex items-baseline justify-between gap-3 border-t border-ink/10 pt-3">
        <span className="font-medium">{t("total")}</span>
        <span className="text-2xl font-medium tabular-money" aria-live="polite">
          {formatBRL(total, locale)}
        </span>
      </div>

      {total > 0 ? (
        <>
          {pixCode ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => copy(pixCode!, t("pixCopied"))}>
                <Copy aria-hidden="true" /> {t("pixCopy")}
              </Button>
              <Button variant="outline" onClick={() => setShowQr((v) => !v)} aria-expanded={showQr}>
                <QrCode aria-hidden="true" /> {t("pixQr")}
              </Button>
            </div>
          ) : (
            <p className="rounded-2xl bg-mint-50 px-4 py-3 text-sm">{t("noPix")}</p>
          )}
          {showQr && pixCode ? <PixQr code={pixCode} /> : null}

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-muted-foreground">{t("tone")}</legend>
            <div className="grid grid-cols-2 gap-2">
              {(["gentle", "firm"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={tone === k}
                  onClick={() => setTone(k)}
                  className={cn("min-h-12 rounded-2xl border-2 px-4 font-medium", tone === k ? "border-primary bg-mint-50" : "border-ink/10")}
                >
                  {t(`tones.${k}`)}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="charge-msg" className="mb-2 block text-sm font-medium text-muted-foreground">
              {t("message")}
            </label>
            <textarea id="charge-msg" readOnly value={message} rows={10} className="w-full rounded-2xl border border-ink/10 bg-mint-50 p-3 text-sm" />
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={() => {
                  void copy(message, t("messageCopied"));
                  markCharged();
                }}
              >
                <Copy aria-hidden="true" /> {t("copyMessage")}
              </Button>
              <a href={waLink(first.clientPhone, message)} target="_blank" rel="noopener noreferrer" onClick={markCharged} className={buttonVariants({ variant: "whatsapp" })}>
                <MessageCircle aria-hidden="true" /> {t("openWhatsapp")}
              </a>
            </div>
            {!first.clientPhone ? <p className="mt-2 text-xs text-muted-foreground">{t("noPhone")}</p> : null}
          </div>

          {canMarkPaid ? (
            paying ? (
              <form
                className="space-y-3 rounded-2xl border border-ink/10 p-4"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  const cents = parseMoneyInput(amount) ?? 0;
                  if (cents <= 0) return toast.error(t("amountRequired"));
                  start(async () => {
                    const r = await payClientChargeAction({ receivableIds: selected.map((i) => i.id), amountCents: cents, paidOn, method: "pix" });
                    if (!r.ok) return void toast.error(te.has(r.error) ? te(r.error as "server_error") : te("server_error"));
                    toast.success(t("paid", { amount: formatBRL(r.data?.appliedCents ?? cents, locale) }));
                    onDone();
                    router.refresh();
                  });
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field id="charge-amount" label={t("amount")}>
                    {(a) => <Input {...a} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className="tabular-money" />}
                  </Field>
                  <Field id="charge-date" label={t("date")}>
                    {(a) => <Input {...a} type="date" max={today} value={paidOn} onChange={(e) => setPaidOn(e.target.value)} />}
                  </Field>
                </div>
                <p className="text-xs text-muted-foreground">{t("allocationNote")}</p>
                <Button type="submit" block disabled={pending}>
                  {pending ? t("saving") : t("confirmPaid")}
                </Button>
              </form>
            ) : (
              <Button
                variant="outline"
                block
                onClick={() => {
                  setAmount(centsToInput(total));
                  setPaying(true);
                }}
              >
                <Banknote aria-hidden="true" /> {t("registerPaid")}
              </Button>
            )
          ) : null}
        </>
      ) : null}
    </div>
  );
}
