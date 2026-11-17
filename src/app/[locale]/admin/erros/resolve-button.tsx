"use client";
import * as React from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { adminResolveErrorAction } from "@/app/admin-actions";
import { cn } from "@/lib/utils";

/** Marca o erro (todas as ocorrências até agora) como resolvido, ou reabre. */
export function ResolveErrorButton({ fingerprint, resolved, className }: { fingerprint: string; resolved: boolean; className?: string }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await adminResolveErrorAction(fingerprint, !resolved);
          if (r.ok) {
            toast.success(r.message ?? "Pronto");
            router.refresh();
          } else toast.error(r.error);
        })
      }
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border px-4 text-sm font-medium disabled:opacity-50",
        resolved ? "border-ink/15 bg-card hover:border-ink/40" : "border-vivid-strong bg-vivid-strong text-primary-foreground hover:bg-vivid",
        className,
      )}
    >
      {resolved ? "Reabrir" : "Marcar resolvido"}
    </button>
  );
}
