"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/card";
import { Info, Eye, EyeOff } from "@/components/icons";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import { PasswordStrengthHint, usePasswordStrength, useWeakPasswordMessage } from "@/components/ui/password-strength";
import { retryMinutes } from "@/lib/rate-limit-client";

type Mode = "neon" | "dev";
type Tab = "login" | "signup";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

export function LoginForm({
  mode,
  devAllowed,
  next,
  initialTab = "login",
  embedded = false,
}: {
  mode: Mode;
  devAllowed: boolean;
  next: string;
  initialTab?: Tab;
  /** dentro do fluxo de assinatura: sem título, sem abas e sem mexer na URL */
  embedded?: boolean;
}) {
  if (mode === "dev") {
    if (!devAllowed) {
      return (
        <Notice tone="danger" className="mt-4" role="alert">
          Login não configurado (BETTER_AUTH_SECRET).
        </Notice>
      );
    }
    return <DevOtpForm next={next} />;
  }
  return <PasswordForm next={next} initialTab={initialTab} embedded={embedded} />;
}

/* ───────── Neon Auth: e-mail + senha (sem e-mail de confirmação por enquanto) ───────── */
function PasswordForm({ next, initialTab, embedded }: { next: string; initialTab: Tab; embedded: boolean }) {
  const t = useTranslations("auth");
  const ts = useTranslations("security");
  const weakMessage = useWeakPasswordMessage();
  const [tab, setTab] = React.useState<Tab>(initialTab);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const isSignup = tab === "signup";
  const strength = usePasswordStrength(isSignup ? password : "", { email: email.trim().toLowerCase() });

  function switchTab(nextTab: Tab) {
    setTab(nextTab);
    setEmailError(null);
    setPasswordError(null);
    setFormError(null);
    if (embedded) return;
    const url = new URL(window.location.href);
    if (nextTab === "signup") url.searchParams.set("conta", "nova");
    else url.searchParams.delete("conta");
    window.history.replaceState(null, "", url);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setPasswordError(null);
    setFormError(null);
    const mail = email.trim().toLowerCase();
    let bad = false;
    if (!EMAIL_RE.test(mail)) {
      setEmailError(t("invalidEmail"));
      bad = true;
    }
    if (password.length < MIN_PASSWORD) {
      setPasswordError(t("passwordShort"));
      bad = true;
    }
    if (bad) return;

    setBusy(true);
    if (isSignup) {
      const verdict = await strength.evaluate();
      if (!verdict.ok) {
        // a dica já aparece no medidor logo acima; aqui só o pedido de ação
        setPasswordError(verdict.hint === "tooShort" ? t("passwordShort") : ts("password.weak"));
        setBusy(false);
        return;
      }
    }
    try {
      // Chama o proxy /api/auth (Neon Auth) direto: os cookies de sessão voltam no Set-Cookie.
      const res = await fetch(tab === "signup" ? "/api/auth/sign-up/email" : "/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(tab === "signup" ? { email: mail, password, name: mail.split("@")[0] ?? mail } : { email: mail, password }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { code?: string; hint?: string; retryAfter?: number };
        const code = body.code ?? "";
        if (res.status === 429) {
          const minutes = retryMinutes(res, body);
          setFormError(minutes ? ts("rateLimited", { minutes }) : t("rateLimited"));
        } else if (code === "PASSWORD_TOO_WEAK") setPasswordError(weakMessage(body.hint));
        else if (code.startsWith("USER_ALREADY_EXISTS")) setFormError(t("userExists"));
        else if (code.includes("PASSWORD_TOO_SHORT")) setPasswordError(t("passwordShort"));
        else if (code === "INVALID_EMAIL") setEmailError(t("invalidEmail"));
        else if (tab === "login" && (res.status === 401 || code.includes("INVALID"))) setFormError(t("wrongCredentials"));
        else setFormError(t("genericError"));
        setBusy(false);
        return;
      }
      window.location.assign(next);
    } catch {
      setFormError(t("genericError"));
      setBusy(false);
    }
  }

  return (
    <div>
      {!embedded ? (
      <>
      <div role="group" aria-label={`${t("tabLogin")} / ${t("tabSignup")}`} className="grid grid-cols-2 gap-1 rounded-full bg-mint-50 p-1">
        {(["login", "signup"] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={tab === k}
            onClick={() => switchTab(k)}
            className={cn(
              "min-h-11 rounded-full text-[0.9375rem] font-medium transition-colors",
              tab === k ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {k === "login" ? t("tabLogin") : t("tabSignup")}
          </button>
        ))}
      </div>

      <h1 className="text-hero mt-7 text-4xl">{isSignup ? t("signupTitle") : t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{isSignup ? t("signupLead") : t("leadPassword")}</p>
      </>
      ) : null}

      <form onSubmit={submit} className={embedded ? "space-y-4" : "mt-6 space-y-4"} noValidate>
        <Field id="email" label={t("email")} hint={t("emailHint")} error={emailError}>
          {(a) => (
            <Input
              {...a}
              type="email"
              inputMode="email"
              autoComplete={isSignup ? "email" : "username"}
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          )}
        </Field>
        <Field
          id="password"
          label={t("password")}
          hint={isSignup ? <PasswordStrengthHint password={password} result={strength.result} checking={strength.checking} emptyHint={t("passwordHint")} /> : undefined}
          error={passwordError}
          trailing={
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? t("hidePassword") : t("showPassword")}
              aria-pressed={show}
              className="inline-flex min-h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-input/70 bg-card text-muted-foreground transition-colors hover:text-foreground"
            >
              {show ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}
            </button>
          }
        >
          {(a) => (
            <Input
              {...a}
              type={show ? "text" : "password"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={MIN_PASSWORD}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(null);
              }}
              onFocus={isSignup ? strength.preload : undefined}
              maxLength={128}
              required
            />
          )}
        </Field>

        {!isSignup ? (
          <p className="-mt-1 text-right text-sm">
            <Link href="/esqueci-senha" className="text-muted-foreground underline underline-offset-4 hover:text-foreground">
              {t("forgot")}
            </Link>
          </p>
        ) : null}

        {formError ? (
          <Notice tone="danger" role="alert">
            <p>{formError}</p>
          </Notice>
        ) : null}

        <Button type="submit" size="lg" block disabled={busy}>
          {isSignup ? (busy ? t("signingUp") : t("signUp")) : busy ? t("signingIn") : t("signIn")}
        </Button>
      </form>

      {!embedded ? (
      <p className="mt-6 text-center text-muted-foreground">
        {isSignup ? t("haveAccount") : t("noAccount")}{" "}
        <button type="button" onClick={() => switchTab(isSignup ? "login" : "signup")} className="min-h-11 font-medium text-foreground underline underline-offset-4">
          {isSignup ? t("tabLogin") : t("tabSignup")}
        </button>
      </p>
      ) : null}
    </div>
  );
}

/* ───────── Modo de desenvolvimento local (sem Neon Auth): código na tela ───────── */
function DevOtpForm({ next }: { next: string }) {
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
    if (!EMAIL_RE.test(email.trim())) {
      setError(t("invalidEmail"));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/dev-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "send", email: email.trim() }) });
      if (res.status === 429) throw new Error("rate");
      if (!res.ok) throw new Error("send");
      const j = (await res.json()) as { devCode?: string };
      setDevCode(j.devCode ?? null);
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
      const res = await fetch("/api/dev-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verify", email: email.trim(), code }) });
      if (res.status === 429) throw new Error("rate");
      if (!res.ok) throw new Error("code");
      window.location.assign(next);
    } catch (err) {
      setError((err as Error).message === "rate" ? t("rateLimited") : t("invalidCode"));
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="text-hero text-4xl">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("lead")}</p>
      <div className="mt-5 space-y-4">
        <Notice tone="info" icon={<Info />}>
          <p>{t("devMode")}</p>
        </Notice>

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
              <p className="rounded-2xl border border-dashed border-mint-400 bg-mint-50 px-3 py-2 font-mono text-lg" role="status">
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
    </div>
  );
}
