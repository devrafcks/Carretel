"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { CircleCheck, Eye, EyeOff } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function post(path: string, body: unknown): Promise<{ ok: boolean; status: number; code: string }> {
  try {
    const res = await fetch(`/api/auth${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify(body) });
    const j = (await res.json().catch(() => ({}))) as { code?: string };
    return { ok: res.ok, status: res.status, code: j.code ?? "" };
  } catch {
    return { ok: false, status: 0, code: "network" };
  }
}

/** Passo 1: e-mail → código. Passo 2: código + senha nova. */
export function ResetPasswordForm({ initialEmail = "" }: { initialEmail?: string }) {
  const t = useTranslations("auth");
  const [step, setStep] = React.useState<"email" | "code" | "done">("email");
  const [email, setEmail] = React.useState(initialEmail);
  const [code, setCode] = React.useState("");
  const [pwd, setPwd] = React.useState("");
  const [pwd2, setPwd2] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    const mail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(mail)) return setError(t("invalidEmail"));
    setBusy(true);
    const r = await post("/email-otp/request-password-reset", { email: mail });
    setBusy(false);
    // por segurança a resposta é a mesma exista ou não a conta
    if (!r.ok && r.status === 429) return setError(t("rateLimited"));
    if (!r.ok && r.status !== 400 && r.status !== 404) return setError(t("genericError"));
    setStep("code");
  }

  async function reset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(code)) return setError(t("invalidCode"));
    if (pwd.length < 8) return setError(t("passwordShort"));
    if (pwd !== pwd2) return setError(t("passwordsDiffer"));
    setBusy(true);
    const r = await post("/email-otp/reset-password", { email: email.trim().toLowerCase(), otp: code, password: pwd });
    setBusy(false);
    if (r.ok) return setStep("done");
    if (r.status === 429) return setError(t("rateLimited"));
    if (r.code.includes("PASSWORD_TOO_SHORT")) return setError(t("passwordShort"));
    setError(t("resetInvalid"));
  }

  if (step === "done") {
    return (
      <div className="text-center">
        <span className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-mint-100 text-vivid-strong">
          <CircleCheck aria-hidden="true" className="size-7" />
        </span>
        <h1 className="text-hero mt-4 text-3xl">{t("resetDone")}</h1>
        <Link href="/entrar" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 font-medium text-primary-foreground hover:bg-primary/85">
          {t("goLogin")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-hero text-4xl">{t("forgotTitle")}</h1>
      <p className="mt-2 text-muted-foreground">{step === "email" ? t("forgotLead") : t("resetCodeLead", { email: email.trim() })}</p>

      {step === "email" ? (
        <form onSubmit={sendCode} className="mt-6 space-y-4" noValidate>
          <Field id="email" label={t("email")} error={error}>
            {(a) => <Input {...a} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />}
          </Field>
          <Button type="submit" size="lg" block disabled={busy}>
            {busy ? t("sending") : t("sendResetCode")}
          </Button>
          <div className="flex flex-wrap justify-between gap-3 text-sm">
            <button type="button" onClick={() => (EMAIL_RE.test(email.trim()) ? setStep("code") : setError(t("invalidEmail")))} className="min-h-11 underline underline-offset-4">
              {t("haveCode")}
            </button>
            <Link href="/entrar" className="inline-flex min-h-11 items-center text-muted-foreground underline underline-offset-4">
              {t("backToLogin")}
            </Link>
          </div>
        </form>
      ) : (
        <form onSubmit={reset} className="mt-6 space-y-4" noValidate>
          <Field id="otp" label={t("code")}>
            {(a) => (
              <Input
                {...a}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="tabular-money-mono text-center text-2xl tracking-[0.5em]"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                autoFocus
              />
            )}
          </Field>
          <Field
            id="np"
            label={t("newPassword")}
            hint={t("passwordHint")}
            trailing={
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? t("hidePassword") : t("showPassword")}
                aria-pressed={show}
                className="inline-flex min-h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-input/70 bg-card text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}
              </button>
            }
          >
            {(a) => <Input {...a} type={show ? "text" : "password"} autoComplete="new-password" value={pwd} onChange={(e) => setPwd(e.target.value)} />}
          </Field>
          <Field id="np2" label={t("confirmPassword")}>
            {(a) => <Input {...a} type={show ? "text" : "password"} autoComplete="new-password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} />}
          </Field>
          {error ? (
            <Notice tone="danger" role="alert">
              <p>{error}</p>
            </Notice>
          ) : null}
          <Button type="submit" size="lg" block disabled={busy}>
            {busy ? t("verifying") : t("saveNewPassword")}
          </Button>
          <div className="flex flex-wrap justify-between gap-3 text-sm">
            <button type="button" onClick={() => void sendCode()} disabled={busy} className="min-h-11 underline underline-offset-4">
              {t("resendCode")}
            </button>
            <Link href="/entrar" className="inline-flex min-h-11 items-center text-muted-foreground underline underline-offset-4">
              {t("backToLogin")}
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
