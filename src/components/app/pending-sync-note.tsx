"use client";
import { useTranslations } from "next-intl";
import { RefreshCw } from "@/components/icons";
import { useOffline } from "./offline-provider";
import { Notice } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function PendingSyncNote() {
  const t = useTranslations("common");
  const { pendingCount, online, sync, syncing } = useOffline();
  if (pendingCount === 0) return null;
  return (
    <Notice tone="awaiting" icon={<RefreshCw />} role="status">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">{t("pendingSync", { count: pendingCount })}</p>
        {online ? (
          <Button size="sm" variant="outline" onClick={() => void sync()} disabled={syncing}>
            {syncing ? t("syncing") : t("retry")}
          </Button>
        ) : null}
      </div>
    </Notice>
  );
}
