"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type TabKey = "hoy" | "acerto" | "equipo";

/**
 * Abas de Produção trocadas no próprio aparelho (instantâneo): as três já vêm carregadas do servidor.
 * A URL acompanha (?tab=…) sem recarregar, para o link da sidebar e o voltar do navegador funcionarem.
 */
export function ProductionTabs({ initial, labels, panels, ariaLabel }: { initial: TabKey; labels: Record<TabKey, string>; panels: Record<TabKey, React.ReactNode>; ariaLabel: string }) {
  const [tab, setTab] = React.useState<TabKey>(initial);

  React.useEffect(() => {
    const onPop = () => {
      const t = new URLSearchParams(window.location.search).get("tab");
      setTab(t === "acerto" || t === "equipo" ? t : "hoy");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function select(k: TabKey) {
    if (k === tab) return;
    setTab(k);
    const url = new URL(window.location.href);
    if (k === "hoy") url.searchParams.delete("tab");
    else url.searchParams.set("tab", k);
    window.history.pushState(null, "", url);
  }

  const keys: TabKey[] = ["hoy", "acerto", "equipo"];
  return (
    <>
      <div role="tablist" aria-label={ariaLabel} className="anim-rise delay-1 mb-5 grid grid-cols-3 gap-1 rounded-full border border-ink/10 bg-card p-1 shadow-soft">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            id={`tab-${k}`}
            aria-selected={tab === k}
            aria-controls={`panel-${k}`}
            onClick={() => select(k)}
            className={cn(
              "inline-flex min-h-12 items-center justify-center whitespace-nowrap rounded-full px-2 text-[0.9375rem] font-medium leading-tight transition-colors",
              tab === k ? "bg-primary text-primary-foreground shadow-soft" : "hover:bg-mint-50",
            )}
          >
            {labels[k]}
          </button>
        ))}
      </div>
      {keys.map((k) => (
        // painéis ficam montados (formulários não perdem o que foi digitado ao trocar de aba)
        <div key={k} role="tabpanel" id={`panel-${k}`} aria-labelledby={`tab-${k}`} hidden={tab !== k}>
          {panels[k]}
        </div>
      ))}
    </>
  );
}
