"use client";
import { useLocale, useTranslations } from "next-intl";
import { FileSpreadsheet, Lock } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type ExcelKind = "lotes" | "cobros" | "clientes" | "producao" | "acertos" | "relatorio";

/**
 * Botão "Exportar Excel". No plano completo baixa a planilha; no grátis mostra o cadeado
 * e leva para a assinatura (o servidor também recusa com 402).
 */
export function ExcelButton({ kind, premium, className }: { kind: ExcelKind; premium: boolean; className?: string }) {
  const t = useTranslations("excel");
  const tp = useTranslations("production");
  const text = kind === "producao" ? `${tp("title")} · Excel` : kind === "acertos" ? `${tp("tabSettle")} · Excel` : t("button");
  const locale = useLocale();
  const base = "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors";
  if (!premium) {
    return (
      <Link href="/assinar" className={cn(base, "border-ink/10 text-muted-foreground hover:border-ink/30 hover:text-foreground", className)} title={t("locked")}>
        <Lock aria-hidden="true" className="size-4" />
        {text}
        <span className="sr-only"> · {t("locked")}</span>
      </Link>
    );
  }
  return (
    <a href={`/api/export/xlsx?t=${kind}&l=${locale}`} download className={cn(base, "border-ink/15 hover:border-chart-1 hover:text-chart-1", className)}>
      <FileSpreadsheet aria-hidden="true" className="size-4" />
      {text}
    </a>
  );
}
