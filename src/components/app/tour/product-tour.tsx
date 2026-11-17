"use client";
/**
 * Tours guiados (driver.js) com o visual do Carretel. Abre sozinho UMA vez por tela (lembra no aparelho);
 * o botão de ajuda da barra de cima (TourHelpButton) abre de novo a qualquer hora.
 * Passos cujo elemento não está visível (celular x computador, tela vazia) são pulados.
 */
import * as React from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import type { Config, Driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import "./tour-theme.css";
import { Help } from "@/components/icons";
import { READY, TOURS, seenKey, tourForPath, type TourKey } from "./tours";

const OPEN_EVENT = "carretel:tour";

function visible(el: Element | null): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false;
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return false;
  const cs = getComputedStyle(el);
  return cs.visibility !== "hidden" && cs.display !== "none";
}

function firstVisible(selectors: string[]): HTMLElement | null {
  for (const s of selectors) {
    for (const el of Array.from(document.querySelectorAll(s))) if (visible(el)) return el;
  }
  return null;
}

/** Quantos passos do tour já têm o elemento visível na tela. */
function countTargets(key: TourKey): number {
  return TOURS[key].filter((s) => s.selectors && firstVisible(s.selectors)).length;
}

/**
 * Espera a tela assentar: o painel aparece antes do conteúdo (que ainda carrega por streaming),
 * então só começa quando os alvos param de aumentar (2 leituras iguais) — no máximo ~10 s.
 */
async function waitForTargets(key: TourKey, signal: { cancelled: boolean }): Promise<number> {
  let last = -1;
  let stable = 0;
  for (let i = 0; i < 25 && !signal.cancelled; i++) {
    await new Promise((r) => setTimeout(r, 400));
    // só conta depois que o conteúdo da página chegou (o menu e o sino existem antes)
    const n = firstVisible([READY[key]]) ? countTargets(key) : 0;
    stable = n > 0 && n === last ? stable + 1 : 0;
    last = n;
    if (stable >= 2) break;
  }
  return Math.max(0, last);
}

function wasSeen(key: TourKey): boolean {
  try {
    return localStorage.getItem(seenKey(key)) === "1";
  } catch {
    return true; // sem storage (aba privada): não insiste em abrir sozinho
  }
}
function markSeen(key: TourKey) {
  try {
    localStorage.setItem(seenKey(key), "1");
  } catch {
    /* sem storage */
  }
}

export function ProductTour() {
  const t = useTranslations("tour");
  const pathname = usePathname();
  const driverRef = React.useRef<Driver | null>(null);

  const start = React.useCallback(
    async (key: TourKey) => {
      if (driverRef.current?.isActive()) return;
      const steps: DriveStep[] = [];
      for (const s of TOURS[key]) {
        const title = t(`${key}.${s.id}Title` as "hoy.welcomeTitle");
        const description = t(`${key}.${s.id}Body` as "hoy.welcomeBody");
        if (!s.selectors) {
          steps.push({ popover: { title, description, popoverClass: "carretel-tour carretel-tour-intro" } });
          continue;
        }
        const el = firstVisible(s.selectors);
        if (el) steps.push({ element: el, popover: { title, description, side: s.side, align: s.align ?? "center" } });
      }
      if (steps.length === 0) return;
      markSeen(key);
      const { driver } = await import("driver.js");
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const total = steps.length;
      const config: Config = {
        steps,
        popoverClass: "carretel-tour",
        animate: !reduce,
        smoothScroll: !reduce,
        overlayColor: "#121815",
        overlayOpacity: 0.55,
        stagePadding: 6,
        stageRadius: 16,
        popoverOffset: 12,
        allowClose: true,
        showProgress: total > 1,
        progressText: t("progress", { current: "{{current}}", total: "{{total}}" }),
        nextBtnText: t("next"),
        prevBtnText: t("prev"),
        doneBtnText: t("done"),
        showButtons: ["next", "previous", "close"],
        onPopoverRender: (popover, { driver: d }) => {
          // barra de progresso (largura em variável CSS) e rótulos acessíveis
          const i = (d.getActiveIndex() ?? 0) + 1;
          popover.wrapper.style.setProperty("--tour-progress", `${Math.round((i / total) * 100)}%`);
          popover.closeButton.setAttribute("aria-label", t("close"));
          popover.wrapper.setAttribute("role", "dialog");
          popover.wrapper.setAttribute("aria-modal", "false");
          if (i === 1) popover.previousButton.style.display = "none";
        },
        onDestroyed: () => {
          driverRef.current = null;
        },
      };
      const d = driver(config);
      driverRef.current = d;
      d.drive();
    },
    [t],
  );

  // abre sozinho na primeira visita de cada tela (depois que a página assentou)
  React.useEffect(() => {
    const key = tourForPath(pathname);
    if (!key || wasSeen(key)) return;
    const signal = { cancelled: false };
    void (async () => {
      const found = await waitForTargets(key, signal);
      if (signal.cancelled || found === 0) return;
      if (document.querySelector('[role="dialog"]:not(.driver-popover)')) return; // outro diálogo aberto: deixa para depois
      void start(key);
    })();
    return () => {
      signal.cancelled = true;
    };
  }, [pathname, start]);

  // pedido manual (botão de ajuda)
  React.useEffect(() => {
    const onOpen = () => {
      const key = tourForPath(window.location.pathname);
      if (key) void start(key);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, [start]);

  // trocar de tela fecha o tour aberto
  React.useEffect(() => () => driverRef.current?.destroy(), [pathname]);

  return null;
}

/** Botão "rever o tour desta tela" (só aparece nas telas que têm tour). */
export function TourHelpButton() {
  const t = useTranslations("tour");
  const pathname = usePathname();
  if (!tourForPath(pathname)) return null;
  return (
    <button
      type="button"
      data-tour="tour-help"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
      aria-label={t("open")}
      title={t("open")}
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-ink/10 bg-card text-muted-foreground transition-colors hover:border-ink/30 hover:text-foreground"
    >
      <Help aria-hidden="true" className="size-5" />
    </button>
  );
}
