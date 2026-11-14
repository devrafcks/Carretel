"use client";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Seletor ES | PT de 1 toque. A bandeira nunca aparece sozinha: sempre com texto.
 *
 * A troca é uma navegação COMPLETA (não client-side): o idioma faz parte do layout raiz
 * (<html lang>), e remontar a raiz no cliente depois que o widget de acessibilidade moveu
 * o #app para o wrapper dele gera NotFoundError no React. Recarregar a página é o caminho estável.
 */
export function LocaleSwitch({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  const locale = useLocale();
  const t = useTranslations("common");
  const pathname = usePathname();
  const search = useSearchParams();

  const hrefFor = (next: "es" | "pt-BR") => {
    const qs = search.toString();
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    return `/${next}${pathname === "/" ? "" : pathname}${qs ? `?${qs}` : ""}${hash}`;
  };

  return (
    <div
      role="group"
      aria-label={t("languageLabel")}
      className={cn(
        "inline-flex rounded-full border p-1",
        tone === "dark" ? "border-white/20 bg-white/10" : "border-ink/10 bg-card",
        className,
      )}
    >
      {(
        [
          ["es", "ES", t("spanish")],
          ["pt-BR", "PT", t("portuguese")],
        ] as const
      ).map(([code, short, full]) => (
        <a
          key={code}
          href={hrefFor(code)}
          hrefLang={code}
          lang={code}
          aria-current={locale === code ? "true" : undefined}
          aria-label={full}
          title={full}
          onClick={(e) => {
            if (code === locale) e.preventDefault();
          }}
          className={cn(
            "inline-flex min-h-10 min-w-11 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors",
            locale === code
              ? tone === "dark"
                ? "bg-white text-ink"
                : "bg-ink text-primary-foreground"
              : tone === "dark"
                ? "text-white/80 hover:text-white"
                : "text-muted-foreground hover:text-foreground",
          )}
        >
          {short}
        </a>
      ))}
    </div>
  );
}
