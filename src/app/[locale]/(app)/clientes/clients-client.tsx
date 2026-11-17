"use client";
import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Pencil, UserX, Plus, Scissors } from "@/components/icons";
import { formatBRL, parseMoneyInput } from "@/lib/money";
import { setClientUsualServiceAction } from "@/app/module-actions";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { FichaIllustration } from "@/components/brand/illustrations";
import { anonymizeClientAction, createClientAction, updateClientAction } from "@/app/actions";
import { initials } from "@/lib/utils";

type C = { id: string; name: string; phone: string; locale: "es" | "pt-BR"; notes: string; usualReference: string; usualUnitPriceCents: number | null; owedCents?: number; batches?: number; openBatches?: number; volumeCents?: number };

export function ClientsManager({ clients, canWrite }: { clients: C[]; canWrite: boolean }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [edit, setEdit] = React.useState<C | "new" | null>(null);
  const [pending, start] = React.useTransition();
  return (
    <div className="space-y-4">
      {canWrite ? (
        <Button data-tour="clients-new" onClick={() => setEdit("new")}>
          <Plus aria-hidden="true" />
          {t("clients.addShort")}
        </Button>
      ) : null}
      {clients.length === 0 ? (
        <EmptyState illustration={<FichaIllustration />} title={t("clients.empty")} />
      ) : (
        <ul className="anim-rise grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {clients.map((c) => (
            <li key={c.id} className="flex flex-col rounded-3xl border border-ink/[0.06] bg-card p-5 shadow-soft">
              <div className="flex items-center gap-3">
              <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-mint-100 font-medium text-accent-foreground">
                {initials(c.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{c.name}</p>
                <p className="text-sm text-muted-foreground">
                  {c.phone ? `${c.phone} · ` : ""}
                  <span lang={c.locale}>{c.locale === "es" ? "Español" : "Português"}</span>
                </p>
              </div>
              {canWrite ? (
                <>
                  <Button variant="ghost" size="icon" aria-label={`${t("common.edit")}: ${c.name}`} onClick={() => setEdit(c)}>
                    <Pencil aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`${t("clients.anonymize")}: ${c.name}`}
                    disabled={pending}
                    onClick={() => {
                      if (!window.confirm(t("clients.anonymizeConfirm"))) return;
                      start(async () => {
                        await anonymizeClientAction(c.id);
                        router.refresh();
                      });
                    }}
                  >
                    <UserX aria-hidden="true" />
                  </Button>
                </>
              ) : null}
              </div>
              {c.usualReference || c.usualUnitPriceCents ? (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-mint-50 px-3 py-2">
                  <p className="min-w-0 text-sm">
                    <span className="text-muted-foreground">{t("clients.usual")}: </span>
                    <span className="font-medium">
                      {[c.usualReference ? `${t("common.reference")} ${c.usualReference}` : null, c.usualUnitPriceCents ? t("clients.usualPrice", { amount: formatBRL(c.usualUnitPriceCents, locale) }) : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </p>
                  {canWrite ? (
                    <Link href={`/lotes/nuevo?cliente=${c.id}`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                      <Scissors aria-hidden="true" />
                      {t("clients.repeatBatch")}
                    </Link>
                  ) : null}
                </div>
              ) : null}
              <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-ink/[0.06] pt-4">
                <div>
                  <dt className="text-xs text-muted-foreground">{t("clients.owes")}</dt>
                  <dd className={cn("mt-0.5 font-medium tabular-money", (c.owedCents ?? 0) > 0 && "text-overdue-calote-fg")}>{formatBRL(c.owedCents ?? 0, locale)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t("clients.openBatches")}</dt>
                  <dd className="mt-0.5 font-medium tabular-money">{c.openBatches ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t("clients.volume")}</dt>
                  <dd className="mt-0.5 font-medium tabular-money">{formatBRL(c.volumeCents ?? 0, locale)}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
      <Dialog open={Boolean(edit)} onOpenChange={(o) => !o && setEdit(null)}>
        {edit ? (
          <DialogContent title={edit === "new" ? t("clients.add") : edit.name} side="bottom" closeLabel={t("common.close")}>
            <ClientForm initial={edit === "new" ? null : edit} onDone={() => setEdit(null)} />
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}

function ClientForm({ initial, onDone }: { initial: C | null; onDone: () => void }) {
  const t = useTranslations();
  const router = useRouter();
  const [name, setName] = React.useState(initial?.name ?? "");
  const [phone, setPhone] = React.useState(initial?.phone ?? "");
  const [loc, setLoc] = React.useState<"es" | "pt-BR">(initial?.locale ?? "pt-BR");
  const [usualRef, setUsualRef] = React.useState(initial?.usualReference ?? "");
  const [usualPrice, setUsualPrice] = React.useState(initial?.usualUnitPriceCents ? (initial.usualUnitPriceCents / 100).toFixed(2).replace(".", ",") : "");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return setError(t("common.required"));
        const usualCents = usualPrice.trim() ? parseMoneyInput(usualPrice) : null;
        start(async () => {
          let r = initial
            ? await updateClientAction(initial.id, { name, phone: phone || undefined, preferredLocale: loc })
            : await createClientAction({ name, phone: phone || undefined, preferredLocale: loc, usualReference: usualRef || undefined, usualUnitPriceCents: usualCents ?? undefined });
          if (r.ok && initial) r = await setClientUsualServiceAction(initial.id, { reference: usualRef || null, unitPriceCents: usualCents || null });
          if (!r.ok) return setError(t("common.errorGeneric"));
          toast.success(t("clients.saved"));
          onDone();
          router.refresh();
        });
      }}
    >
      <Field id="cname" label={t("clients.name")} error={error}>
        {(a) => <Input {...a} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />}
      </Field>
      <Field id="cphone" label={t("clients.phone")} optional={t("common.optional")}>
        {(a) => <Input {...a} type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />}
      </Field>
      <Field id="cloc" label={t("clients.locale")}>
        {(a) => (
          <Select {...a} value={loc} onChange={(e) => setLoc(e.target.value as "es" | "pt-BR")}>
            <option value="pt-BR" lang="pt-BR">
              Português
            </option>
            <option value="es" lang="es">
              Español
            </option>
          </Select>
        )}
      </Field>
      <fieldset className="space-y-3 rounded-2xl border border-ink/10 p-4">
        <legend className="px-1 text-sm font-medium">{t("clients.usual")}</legend>
        <p className="text-sm text-muted-foreground">{t("clients.usualHint")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field id="curef" label={t("clients.usualReference")} optional={t("common.optional")}>
            {(a) => <Input {...a} value={usualRef} onChange={(e) => setUsualRef(e.target.value)} maxLength={80} autoComplete="off" />}
          </Field>
          <Field id="cuprice" label={t("clients.usualUnitPrice")} optional={t("common.optional")}>
            {(a) => <Input {...a} inputMode="decimal" value={usualPrice} onChange={(e) => setUsualPrice(e.target.value)} placeholder="1,20" className="tabular-money" />}
          </Field>
        </div>
      </fieldset>
      <Button type="submit" size="lg" block disabled={pending}>
        {t("clients.save")}
      </Button>
    </form>
  );
}

export { Card };
