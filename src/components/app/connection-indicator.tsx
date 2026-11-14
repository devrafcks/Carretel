"use client";
import { useTranslations } from "next-intl";
import { CloudOff, RefreshCw, Wifi } from "@/components/icons";
import { useOffline } from "./offline-provider";
import { cn } from "@/lib/utils";

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
  const Icon = !online ? CloudOff : syncing || pendingCount > 0 ? RefreshCw : Wifi;
  return (
    <button
      type="button"
      onClick={() => void sync()}
      disabled={!online || pendingCount === 0}
      aria-live="polite"
      className={cn(
        "inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-sm",
        !online
          ? "border-overdue-calote-border/40 bg-overdue-calote-bg text-overdue-calote-fg"
          : pendingCount > 0
            ? "border-awaiting-confirmation-border/40 bg-awaiting-confirmation-bg text-awaiting-confirmation-fg"
            : "border-ink/10 bg-card text-muted-foreground",
        "disabled:cursor-default",
      )}
    >
      {online && pendingCount === 0 ? <span aria-hidden="true" className="size-2 rounded-full bg-vivid" /> : <Icon aria-hidden="true" className={cn("size-4", syncing && "motion-safe:animate-spin")} />}
      <span className={cn(online && pendingCount === 0 && "sr-only sm:not-sr-only")}>{label}</span>
    </button>
  );
}
