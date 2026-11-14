"use client";
import { useTranslations } from "next-intl";
import { CloudOff, RefreshCw, Wifi } from "lucide-react";
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
        "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-2.5 text-[0.9375rem] font-semibold",
        !online
          ? "border-overdue-calote-border bg-overdue-calote-bg text-overdue-calote-fg"
          : pendingCount > 0
            ? "border-awaiting-confirmation-border bg-awaiting-confirmation-bg text-awaiting-confirmation-fg"
            : "border-paid-border bg-paid-bg text-paid-fg",
        "disabled:cursor-default",
      )}
    >
      <Icon aria-hidden="true" className={cn("size-4", syncing && "motion-safe:animate-spin")} />
      <span className={cn(online && pendingCount === 0 && "sr-only sm:not-sr-only")}>{label}</span>
    </button>
  );
}
