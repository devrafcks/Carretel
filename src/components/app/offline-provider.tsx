"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { onQueueChange, pending, submitMutation, syncNow, type QueuedMutation } from "@/lib/offline/queue";
import type { MutationType } from "@/lib/schemas";

interface OfflineCtx {
  online: boolean;
  pendingCount: number;
  syncing: boolean;
  workshopId: string;
  sync: () => Promise<void>;
  submit: (
    type: MutationType,
    payload: Record<string, unknown>,
    opts?: { photos?: QueuedMutation["photos"]; photoField?: string },
  ) => Promise<{ queued: boolean; ok: boolean; error?: string; ref?: string; serverId?: string }>;
}

const Ctx = React.createContext<OfflineCtx | null>(null);

export function useOffline() {
  const c = React.useContext(Ctx);
  if (!c) throw new Error("OfflineProvider ausente");
  return c;
}

function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

export function OfflineProvider({ workshopId, children }: { workshopId: string; children: React.ReactNode }) {
  const router = useRouter();
  const t = useTranslations();
  const online = React.useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const [pendingCount, setPending] = React.useState(0);
  const [syncing, setSyncing] = React.useState(false);
  const backoff = React.useRef(5_000);
  // foto recusada pelo servidor: o registro foi salvo sem ela; diz o motivo em vez de tentar para sempre
  const photoErrorText = React.useCallback(
    (code: string) => {
      const key = `photoErrors.${code}`;
      return t.has(key) ? t(key as "photoErrors.server_error") : t("photoErrors.generic");
    },
    [t],
  );

  const refreshCount = React.useCallback(async () => {
    try {
      setPending((await pending(workshopId)).length);
    } catch {
      /* IndexedDB indisponível (modo privado) */
    }
  }, [workshopId]);

  const sync = React.useCallback(async () => {
    if (!navigator.onLine) return;
    const before = (await pending(workshopId).catch(() => [])).length;
    if (before === 0) return;
    setSyncing(true);
    try {
      const r = await syncNow(workshopId);
      backoff.current = 5_000;
      if (r.photoErrors.length) toast.error(photoErrorText(r.photoErrors[0]!));
      if (r.sent > 0) {
        if (r.rejected.length) {
          for (const rej of r.rejected) toast.error(t.has(`errors.${rej.error}`) ? t(`errors.${rej.error}` as "errors.server_error") : t("common.errorGeneric"));
        } else {
          toast.success(t("common.syncDone"));
        }
        router.refresh();
      }
    } catch {
      backoff.current = Math.min(backoff.current * 2, 5 * 60_000);
    } finally {
      setSyncing(false);
      refreshCount();
    }
  }, [workshopId, router, t, refreshCount, photoErrorText]);

  React.useEffect(() => {
    const t0 = setTimeout(refreshCount, 0);
    const off = onQueueChange(refreshCount);
    return () => {
      clearTimeout(t0);
      off();
    };
  }, [refreshCount]);

  React.useEffect(() => {
    if (online) {
      const t1 = setTimeout(() => void sync(), 0);
      return () => clearTimeout(t1);
    }
  }, [online, sync]);

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      void sync();
      timer = setTimeout(tick, backoff.current);
    };
    timer = setTimeout(tick, backoff.current);
    return () => clearTimeout(timer);
  }, [sync]);

  const submit = React.useCallback<OfflineCtx["submit"]>(
    async (type, payload, opts) => {
      const r = await submitMutation(workshopId, type, payload, opts);
      if (r.photoErrors?.length) toast.error(photoErrorText(r.photoErrors[0]!));
      if (r.queued) {
        refreshCount();
        return { queued: true, ok: true };
      }
      const res = r.result!;
      if (res.status === "rejected") return { queued: false, ok: false, error: res.error };
      router.refresh();
      return { queued: false, ok: true, serverId: res.serverId };
    },
    [workshopId, router, refreshCount, photoErrorText],
  );

  const value = React.useMemo(() => ({ online, pendingCount, syncing, workshopId, sync, submit }), [online, pendingCount, syncing, workshopId, sync, submit]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
