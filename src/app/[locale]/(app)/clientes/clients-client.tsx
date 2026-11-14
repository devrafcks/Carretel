"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Pencil, UserX } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { FichaIllustration } from "@/components/brand/illustrations";
import { anonymizeClientAction, createClientAction, updateClientAction } from "@/app/actions";
import { initials } from "@/lib/utils";

type C = { id: string; name: string; phone: string; locale: "es" | "pt-BR"; notes: string };

export function ClientsManager({ clients, canWrite }: { clients: C[]; canWrite: boolean }) {
  const t = useTranslations();
  const router = useRouter();
  const [edit, setEdit] = React.useState<C | "new" | null>(null);
  const [pending, start] = React.useTransition();
  return (
    <div className="space-y-4">
      {canWrite ? (
        <Button onClick={() => setEdit("new")} block size="lg">
          {t("clients.add")}
        </Button>
      ) : null}
      {clients.length === 0 ? (
        <EmptyState illustration={<FichaIllustration />} title={t("clients.empty")} />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {clients.map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-4 py-3">
              <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary font-bold">
                {initials(c.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{c.name}</p>
                <p className="text-muted-foreground">
                  {c.phone || "—"} · <span lang={c.locale}>{c.locale === "es" ? "Español" : "Português"}</span>
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
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return setError(t("common.required"));
        start(async () => {
          const r = initial
            ? await updateClientAction(initial.id, { name, phone: phone || undefined, preferredLocale: loc })
            : await createClientAction({ name, phone: phone || undefined, preferredLocale: loc });
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
      <Button type="submit" size="lg" block disabled={pending}>
        {t("clients.save")}
      </Button>
    </form>
  );
}

export { Card };
