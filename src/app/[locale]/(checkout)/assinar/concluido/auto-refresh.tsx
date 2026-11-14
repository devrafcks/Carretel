"use client";
import * as React from "react";

/** Confere de novo a cada 3 s (até 10 vezes) enquanto a AbacatePay confirma o pagamento. */
export function AutoRefresh({ tries, label }: { tries: number; label: string }) {
  React.useEffect(() => {
    const id = window.setTimeout(() => {
      const url = new URL(window.location.href);
      url.searchParams.set("t", String(tries + 1));
      window.location.replace(url.toString());
    }, 3000);
    return () => window.clearTimeout(id);
  }, [tries]);
  return (
    <p className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground" role="status">
      <span className="size-2 rounded-full bg-vivid motion-safe:animate-pulse" aria-hidden="true" />
      {label}
    </p>
  );
}
