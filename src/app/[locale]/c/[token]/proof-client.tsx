"use client";
import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { CircleCheck, Copy, Banknote } from "@/components/icons";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, Notice } from "@/components/ui/card";
import { Field, Input, Textarea, Checkbox } from "@/components/ui/field";
import { PixQr } from "@/app/[locale]/(app)/cobros/cobros-client";
import { claimPaidAction, confirmProofAction, disputeProofAction, type PublicResult } from "@/app/public-actions";
import { formatDateTime } from "@/lib/dates";

function msg(t: ReturnType<typeof useTranslations>, r: PublicResult) {
  if (r.ok) return null;
  if (r.error === "rate_limited") return t("proof.rateLimited");
  if (r.error === "validation") return t("proof.validation");
  if (r.error === "not_found") return t("proof.invalid");
  return t("common.errorGeneric");
}

export function ProofActions({ token, deliveredQuantity }: { token: string; deliveredQuantity: number }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [mode, setMode] = React.useState<"confirm" | "dispute">("confirm");
  const [name, setName] = React.useState("");
  const [checked, setChecked] = React.useState(false);
  const [qty, setQty] = React.useState("");
  const [comment, setComment] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();

  if (done) {
    return (
      <Notice tone="success" icon={<CircleCheck />} role="status">
        <p className="font-semibold">{done}</p>
      </Notice>
    );
  }

  return (
    <Card className="p-5">
      <h2 className="font-display text-xl font-bold">{t("proof.confirmTitle")}</h2>
      {mode === "confirm" ? (
        <form
          className="mt-4 space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            start(async () => {
              const r = await confirmProofAction(token, name, checked);
              if (!r.ok) return setError(msg(t, r));
              const now = formatDateTime(new Date(), locale);
              setDone(t("proof.thanks", { name: name.trim(), ...now }));
              router.refresh();
            });
          }}
        >
          <Field id="cn" label={t("proof.yourName")} error={error}>
            {(a) => <Input {...a} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={120} />}
          </Field>
          <label className="flex min-h-12 items-start gap-3 font-semibold">
            <Checkbox checked={checked} onChange={(e) => setChecked(e.target.checked)} />
            <span>{t("proof.checkbox")}</span>
          </label>
          <Button type="submit" size="lg" block variant="success" disabled={pending}>
            <CircleCheck aria-hidden="true" />
            {pending ? t("proof.confirming") : t("proof.confirm")}
          </Button>
          {/* ações opostas separadas por ≥ 12px e empilhadas */}
          <div className="pt-3">
            <Button variant="outline" block onClick={() => setMode("dispute")}>
              {t("proof.disputeOpen")}
            </Button>
          </div>
        </form>
      ) : (
        <form
          className="mt-4 space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            start(async () => {
              const r = await disputeProofAction(token, Number(qty), comment);
              if (!r.ok) return setError(msg(t, r));
              setDone(t("proof.disputeSent"));
              router.refresh();
            });
          }}
        >
          <Field id="dq" label={t("proof.disputeQuantity")} hint={`${t("proof.quantity")}: ${deliveredQuantity}`} error={error}>
            {(a) => <Input {...a} inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))} className="tabular-money text-xl font-bold" />}
          </Field>
          <Field id="dc" label={t("proof.disputeComment")}>
            {(a) => <Textarea {...a} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} />}
          </Field>
          <Button type="submit" size="lg" block disabled={pending}>
            {t("proof.disputeSubmit")}
          </Button>
          <div className="pt-3">
            <Button variant="ghost" block onClick={() => setMode("confirm")}>
              {t("common.back")}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}

export function PixBox({ token, pix, amountLabel, paid }: { token: string; pix: string | null; amountLabel: string; paid: boolean }) {
  const t = useTranslations();
  const [claimed, setClaimed] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [pending, start] = React.useTransition();
  if (paid) return null;
  return (
    <Card className="p-5">
      <h2 className="font-display text-xl font-bold">{t("proof.payTitle")}</h2>
      <p className="mt-1">{t("proof.payLead")}</p>
      {pix ? (
        <div className="mt-4 space-y-3">
          <p className="tabular-money text-2xl font-bold">{amountLabel}</p>
          <PixQr code={pix} />
          <Button
            size="lg"
            block
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(pix);
                setCopied(true);
              } catch {
                window.prompt(t("cobros.pixCopy"), pix);
              }
            }}
          >
            <Copy aria-hidden="true" /> {copied ? t("cobros.pixCopied") : t("cobros.pixCopy")}
          </Button>
          <div className="pt-3">
            {claimed ? (
              <Notice tone="success" role="status">
                <p className="font-semibold">{t("proof.paidClaimSent")}</p>
              </Notice>
            ) : (
              <Button
                variant="outline"
                block
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const r = await claimPaidAction(token);
                    if (r.ok) setClaimed(true);
                  })
                }
              >
                <Banknote aria-hidden="true" /> {t("proof.paidClaim")}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-muted-foreground">{t("proof.noPix")}</p>
      )}
    </Card>
  );
}
