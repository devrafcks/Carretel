"use client";
/**
 * Medidor de força da senha (cadastro e senha nova). A regra é a de src/lib/password-strength.ts,
 * a mesma que o servidor aplica; a biblioteca só baixa quando a pessoa começa a digitar a senha.
 */
import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { checkPassword, preloadPasswordChecker, type PasswordHint, type StrengthLocale, type StrengthResult } from "@/lib/password-strength";
import { cn } from "@/lib/utils";

function strengthLocale(locale: string): StrengthLocale {
  return locale === "pt-BR" ? "pt-BR" : "es";
}

/** Avalia enquanto digita (com pequena espera) e expõe `evaluate()` para a hora do envio. */
export function usePasswordStrength(password: string, who: { email?: string; name?: string } = {}) {
  const locale = useLocale();
  const locales = React.useMemo(() => [strengthLocale(locale)], [locale]);
  const [state, setState] = React.useState<{ password: string; result: StrengthResult } | null>(null);
  const { email, name } = who;

  React.useEffect(() => {
    if (!password) return;
    let alive = true;
    const id = setTimeout(() => {
      void checkPassword(password, { locales, email, name }).then((result) => {
        if (alive) setState({ password, result });
      });
    }, 150);
    return () => {
      alive = false;
      clearTimeout(id);
    };
  }, [password, email, name, locales]);

  const evaluate = React.useCallback(() => checkPassword(password, { locales, email, name }), [password, email, name, locales]);
  const preload = React.useCallback(() => preloadPasswordChecker(locales), [locales]);

  // resultado só vale para a senha que está no campo agora
  const result = password && state?.password === password ? state.result : null;
  return { result, checking: Boolean(password) && !result, evaluate, preload };
}

const BAR_TONE: Record<number, string> = { 0: "bg-destructive", 1: "bg-destructive", 2: "bg-sun", 3: "bg-leaf", 4: "bg-leaf" };

/** Texto da dica + "escolha uma senha mais forte" (formulários usam para a mensagem de erro). */
export function useWeakPasswordMessage() {
  const t = useTranslations("security.password");
  return React.useCallback((hint: PasswordHint | string | null | undefined) => {
    const known = ["tooShort", "tooLong", "common", "pattern", "repeat", "dates", "names", "personal", "longer"];
    return hint && known.includes(hint) ? `${t(`hints.${hint as PasswordHint}`)} ${t("weak")}` : t("weak");
  }, [t]);
}

/**
 * Conteúdo para o `hint` do Field (fica ligado ao campo via aria-describedby).
 * Só usa <span>: o hint do Field é renderizado dentro de um <p>.
 */
export function PasswordStrengthHint({ password, result, checking, emptyHint }: { password: string; result: StrengthResult | null; checking: boolean; emptyHint: string }) {
  const t = useTranslations("security.password");
  if (!password) {
    return (
      <span className="block">
        {emptyHint} {t("tip")}
      </span>
    );
  }
  const score = result?.score ?? 0;
  const filled = result ? Math.max(1, score) : 0;
  return (
    <span className="block space-y-1.5 pt-0.5">
      <span className="grid grid-cols-4 gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={cn("h-1.5 rounded-full transition-colors", i <= filled ? BAR_TONE[score] : "bg-muted")} />
        ))}
      </span>
      <span className="block" aria-live="polite">
        {checking || !result ? (
          t("checking")
        ) : (
          <>
            <span className="font-medium text-foreground">
              {t("label")}: {t(`levels.s${score as 0 | 1 | 2 | 3 | 4}`)}.
            </span>
            {result.hint ? <> {t(`hints.${result.hint}`)}</> : null}
          </>
        )}
      </span>
    </span>
  );
}
