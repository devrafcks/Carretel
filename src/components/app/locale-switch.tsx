"use client";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTransition } from "react";

/** Seletor ES | PT de 1 toque. A bandeira nunca aparece sozinha: sempre com texto. */
export function LocaleSwitch({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [pending, start] = useTransition();

  const go = (next: "es" | "pt-BR") => {
    if (next === locale) return;
    const qs = search.toString();
    start(() => router.replace(pathname + (qs ? `?${qs}` : ""), { locale: next }));
  };

  return (
    <div role="group" aria-label={t("languageLabel")} className={cn("inline-flex rounded-lg border border-border bg-card p-0.5", className)} aria-busy={pending}>
      {(
        [
          ["es", "ES", t("spanish")],
          ["pt-BR", "PT", t("portuguese")],
        ] as const
      ).map(([code, short, full]) => (
        <button
          key={code}
          type="button"
          lang={code}
          onClick={() => go(code)}
          aria-pressed={locale === code}
          aria-label={full}
          title={full}
          className={cn(
            "min-h-11 min-w-12 rounded-md px-2.5 text-[0.9375rem] font-semibold",
            locale === code ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
          )}
        >
          {short}
        </button>
      ))}
    </div>
  );
}
