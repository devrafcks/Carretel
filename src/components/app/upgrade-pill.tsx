"use client";
import { useTranslations } from "next-intl";
import { Sparkles } from "@/components/icons";
import { Link } from "@/i18n/navigation";

/** Atalho de upgrade na barra de cima (só no celular; no computador fica na sidebar). */
export function UpgradePill() {
  const t = useTranslations("subscribe");
  return (
    <Link href="/assinar" className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-vivid-strong px-4 text-sm font-medium text-primary-foreground lg:hidden">
      <Sparkles aria-hidden="true" className="size-4" />
      {t("upgradeShort")}
    </Link>
  );
}
