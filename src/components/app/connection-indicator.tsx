"use client";
import { useTranslations } from "next-intl";
import { RefreshCw, Wifi, WifiOff } from "@/components/icons";
import { useOffline } from "./offline-provider";
import { cn } from "@/lib/utils";

/** Ícone de rede: verde com sinal, vermelho sem sinal, girando ao enviar. O número mostra registros esperando envio. */
export function ConnectionIndicator() {
  const t = useTranslations("common");
  const { online, pendingCount, syncing, sync } = useOffline();
  const label = !online
    ? t("offlinePending", { count: pendingCount })
    : syncing
      ? t("syncing")
      : pendingCount > 0
        ? t("pending", { count: pendingCount })
        : t("online");
  const Icon = !online ? WifiOff : syncing ? RefreshCw : Wifi;
  return (
    <button
      type="button"
      onClick={() => void sync()}
      disabled={!online || pendingCount === 0}
      aria-label={label}
      title={label}
      className={cn(
        "relative inline-flex size-11 items-center justify-center rounded-full border transition-colors disabled:cursor-default",
        !online
          ? "border-overdue-calote-border/40 bg-overdue-calote-bg text-overdue-calote-fg"
          : pendingCount > 0
            ? "border-awaiting-confirmation-border/40 bg-awaiting-confirmation-bg text-awaiting-confirmation-fg"
            : "border-ink/10 bg-card text-vivid-strong",
      )}
    >
      <Icon aria-hidden="true" className={cn("size-5", syncing && "motion-safe:animate-spin")} stroke={1.8} />
      {pendingCount > 0 ? (
        <span aria-hidden="true" className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[0.6875rem] font-medium leading-5 text-primary-foreground">
          {pendingCount}
        </span>
      ) : null}
      <span className="sr-only" aria-live="polite">
        {label}
      </span>
    </button>
  );
}
