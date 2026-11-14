"use client";
import * as React from "react";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Minus, Plus } from "@/components/icons";
import { createWorkshopAction, type ActionResult } from "@/app/actions";
import { Field, Input, Select, Checkbox } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

export function OnboardingForm({ returnTo }: { returnTo?: "assinar" } = {}) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(createWorkshopAction, null);
  const [machines, setMachines] = React.useState(3);
  const [showPix, setShowPix] = React.useState(false);
  const err = state && !state.ok ? state : null;

  return (
    <form action={action} className="mt-5 space-y-5">
      {returnTo ? <input type="hidden" name="next" value={returnTo} /> : null}
      <Field id="name" label={t("onboarding.name")} error={err?.field === "name" ? t("common.required") : null}>
        {(a) => <Input {...a} name="name" required minLength={2} maxLength={80} placeholder={t("onboarding.namePlaceholder")} autoComplete="organization" />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="district" label={t("onboarding.district")} optional={t("common.optional")}>
          {(a) => <Input {...a} name="district" maxLength={80} />}
        </Field>
        <Field id="city" label={t("onboarding.city")} optional={t("common.optional")}>
          {(a) => <Input {...a} name="city" maxLength={80} defaultValue="São Paulo" />}
        </Field>
      </div>

      <fieldset>
        <legend className="font-semibold">{t("onboarding.machines")}</legend>
        <div className="mt-1.5 flex items-center gap-3">
          <Button variant="outline" size="icon" aria-label="−1" onClick={() => setMachines((m) => Math.max(1, m - 1))}>
            <Minus aria-hidden="true" />
          </Button>
          <output aria-live="polite" className="tabular-money min-w-12 text-center text-2xl font-bold">
            {machines}
          </output>
          <Button variant="outline" size="icon" aria-label="+1" onClick={() => setMachines((m) => Math.min(200, m + 1))}>
            <Plus aria-hidden="true" />
          </Button>
          <input type="hidden" name="machineCount" value={machines} />
        </div>
      </fieldset>

      <p className="text-muted-foreground">{t("onboarding.docNote")}</p>

      <div className="rounded-lg border border-border p-4">
        <h2 className="font-display text-lg">{t("onboarding.pixTitle")}</h2>
        <p className="mt-1">{t("onboarding.pixLead")}</p>
        {showPix ? (
          <div className="mt-4 space-y-4">
            <Field id="pixKeyType" label={t("onboarding.pixType")}>
              {(a) => (
                <Select {...a} name="pixKeyType" defaultValue="evp">
                  {(["evp", "phone", "email", "cpf", "cnpj"] as const).map((k) => (
                    <option key={k} value={k}>
                      {t(`pixTypes.${k}`)}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field id="pixKey" label={t("onboarding.pixKey")}>
              {(a) => <Input {...a} name="pixKey" maxLength={77} autoCapitalize="none" spellCheck={false} className="font-mono" />}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="pixMerchantName" label={t("onboarding.pixName")}>
                {(a) => <Input {...a} name="pixMerchantName" maxLength={25} />}
              </Field>
              <Field id="pixCity" label={t("onboarding.pixCity")}>
                {(a) => <Input {...a} name="pixCity" maxLength={15} defaultValue="Sao Paulo" />}
              </Field>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" onClick={() => setShowPix(true)}>
              {t("onboarding.pixKey")}
            </Button>
            <p className="self-center text-muted-foreground">{t("onboarding.pixSkip")}</p>
          </div>
        )}
      </div>

      <fieldset className="space-y-3">
        <legend className="font-display text-lg font-semibold">{t("onboarding.acceptTitle")}</legend>
        <label className="flex min-h-12 items-start gap-3">
          <Checkbox name="acceptTerms" required />
          <span>
            {t.rich("onboarding.acceptTerms", {
              terms: () => (
                <Link href="/terminos" target="_blank" className="font-semibold text-primary underline underline-offset-4">
                  {t("onboarding.termsLink")}
                </Link>
              ),
            })}
          </span>
        </label>
        <label className="flex min-h-12 items-start gap-3">
          <Checkbox name="acceptPrivacy" required />
          <span>
            {t.rich("onboarding.acceptPrivacy", {
              privacy: () => (
                <Link href="/privacidad" target="_blank" className="font-semibold text-primary underline underline-offset-4">
                  {t("onboarding.privacyLink")}
                </Link>
              ),
            })}
          </span>
        </label>
      </fieldset>

      <div aria-live="polite">
        {err ? (
          <Notice tone="danger" role="alert">
            <p className="font-semibold">{err.error === "accept_required" ? t("onboarding.acceptRequired") : t("common.errorValidation")}</p>
          </Notice>
        ) : null}
      </div>

      <Button type="submit" size="lg" block disabled={pending}>
        {pending ? t("onboarding.submitting") : t("onboarding.submit")}
      </Button>
    </form>
  );
}
