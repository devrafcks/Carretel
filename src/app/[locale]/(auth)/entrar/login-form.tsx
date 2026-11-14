"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/card";
import { Info } from "lucide-react";

type Mode = "neon" | "dev";

async function neonClient() {
  const { createAuthClient } = await import("@neon/auth/next");
  return createAuthClient();
}

export function LoginForm({ mode, devAllowed, next }: { mode: Mode; devAllowed: boolean; next: string }) {
  const t = useTranslations("auth");
  const [step, setStep] = React.useState<"email" | "code">("email");
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [devCode, setDevCode] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const codeRef = React.useRef<HTMLInputElement>(null);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t("invalidEmail"));
      return;
    }
    setBusy(true);
    try {
      if (mode === "neon") {
        const c = await neonClient();
        const r = await c.emailOtp.sendVerificationOtp({ email: email.trim(), type: "sign-in" });
        if (r.error) throw new Error(r.error.status === 429 ? "rate" : "send");
      } else {
        const res = await fetch("/api/dev-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "send", email: email.trim() }) });
        if (res.status === 429) throw new Error("rate");
        if (!res.ok) throw new Error("send");
        const j = (await res.json()) as { devCode?: string };
        setDevCode(j.devCode ?? null);
      }
      setStep("code");
      setTimeout(() => codeRef.current?.focus(), 50);
    } catch (err) {
      setError((err as Error).message === "rate" ? t("rateLimited") : t("invalidEmail"));
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(code)) {
      setError(t("invalidCode"));
      return;
    }
    setBusy(true);
    try {
      if (mode === "neon") {
        const c = await neonClient();
        const r = await c.signIn.emailOtp({ email: email.trim(), otp: code });
        if (r.error) throw new Error(r.error.status === 429 ? "rate" : "code");
      } else {
        const res = await fetch("/api/dev-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verify", email: email.trim(), code }) });
        if (res.status === 429) throw new Error("rate");
        if (!res.ok) throw new Error("code");
      }
      window.location.assign(next);
    } catch (err) {
      setError((err as Error).message === "rate" ? t("rateLimited") : t("invalidCode"));
      setBusy(false);
    }
  }

  if (mode === "dev" && !devAllowed) {
    return (
      <Notice tone="danger" className="mt-4" role="alert">
        Neon Auth não configurado (NEON_AUTH_BASE_URL / NEON_AUTH_COOKIE_SECRET).
      </Notice>
    );
  }

  return (
    <div className="mt-5 space-y-4">
      {mode === "dev" ? (
        <Notice tone="info" icon={<Info />}>
          <p>{t("devMode")}</p>
        </Notice>
      ) : null}

      {step === "email" ? (
        <form onSubmit={send} className="space-y-4" noValidate>
          <Field id="email" label={t("email")} hint={t("emailHint")} error={error}>
            {(a) => (
              <Input
                {...a}
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            )}
          </Field>
          <Button type="submit" size="lg" block disabled={busy}>
            {busy ? t("sending") : t("sendCode")}
          </Button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-4" noValidate>
          <div>
            <h2 className="font-display">{t("codeTitle")}</h2>
            <p className="mt-1">{t("codeLead", { email })}</p>
          </div>
          {devCode ? (
            <p className="rounded-lg border border-dashed border-primary bg-in-production-bg px-3 py-2 font-mono text-lg text-in-production-fg" role="status">
              {t("devCode", { code: devCode })}
            </p>
          ) : null}
          <Field id="otp" label={t("code")} error={error}>
            {(a) => (
              <Input
                {...a}
                ref={codeRef}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                className="tabular-money-mono text-center text-2xl tracking-[0.5em]"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
            )}
          </Field>
          <Button type="submit" size="lg" block disabled={busy}>
            {busy ? t("verifying") : t("verify")}
          </Button>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="ghost" block onClick={() => void send()} disabled={busy}>
              {t("resend")}
            </Button>
            <Button
              variant="ghost"
              block
              onClick={() => {
                setStep("email");
                setCode("");
                setDevCode(null);
                setError(null);
              }}
            >
              {t("changeEmail")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
