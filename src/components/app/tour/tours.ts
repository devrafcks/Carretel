/**
 * Tours guiados por tela. Cada passo aponta para um ou mais seletores (o primeiro VISÍVEL ganha:
 * no celular a barra de baixo, no computador a lateral). Sem seletor = passo centralizado (boas-vindas).
 * Os textos ficam em messages (namespace "tour").
 */
export type TourKey = "hoy" | "nuevo" | "cobros" | "produccion";

export type TourStep = {
  /** chave em tour.<key>.<id>Title / <id>Body */
  id: string;
  selectors?: string[];
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
};

const sideNav = (href: string) => [`nav[data-bottom-nav] a[href$="${href}"]`, `nav:not([data-bottom-nav]) a[href$="${href}"]`];

export const TOURS: Record<TourKey, TourStep[]> = {
  hoy: [
    { id: "welcome" },
    { id: "newBatch", selectors: ['[data-tour="hoy-new-batch"]'], side: "bottom", align: "start" },
    { id: "numbers", selectors: ['[data-tour="hoy-numbers-mobile"]', '[data-tour="hoy-numbers"]'], side: "bottom" },
    { id: "steps", selectors: ['[data-tour="hoy-first-steps"]'], side: "top" },
    { id: "charts", selectors: ['[data-tour="hoy-charts"] > :first-child'], side: "top" },
    { id: "cobros", selectors: sideNav("/cobros"), side: "top" },
    { id: "produccion", selectors: sideNav("/produccion"), side: "top" },
    { id: "bell", selectors: ['[data-tour="notifications"]'], side: "bottom", align: "end" },
    { id: "help", selectors: ['[data-tour="tour-help"]'], side: "bottom", align: "end" },
  ],
  nuevo: [
    { id: "client", selectors: ["#client"], side: "bottom" },
    { id: "quantity", selectors: ["#quantity"], side: "bottom" },
    { id: "price", selectors: ["#price"], side: "top" },
    { id: "save", selectors: ["[data-fixed-bar]"], side: "top" },
  ],
  cobros: [
    { id: "total", selectors: ["main h1"], side: "bottom", align: "start" },
    { id: "awaiting", selectors: ["#sec-awaiting"], side: "bottom", align: "start" },
    { id: "confirmed", selectors: ["#sec-confirmed"], side: "bottom", align: "start" },
    { id: "pix", selectors: ["main details"], side: "bottom" },
  ],
  produccion: [
    { id: "tabs", selectors: ['[role="tablist"]'], side: "bottom" },
    { id: "settle", selectors: ["#tab-acerto"], side: "bottom" },
    { id: "team", selectors: ["#tab-equipo"], side: "bottom", align: "end" },
  ],
};

/** Elemento DA PÁGINA que indica que o conteúdo já chegou (o painel aparece antes, por streaming). */
export const READY: Record<TourKey, string> = {
  hoy: '[data-tour="hoy-new-batch"]',
  nuevo: "#client",
  cobros: "main h1",
  produccion: '[role="tablist"]',
};

/** Qual tour vale para o caminho atual (/pt-BR/hoy, /es/lotes/nuevo, ...). */
export function tourForPath(pathname: string): TourKey | null {
  const parts = pathname.split("/").filter(Boolean); // [locale, segment, ...]
  const [, seg, sub] = parts;
  if (seg === "hoy") return "hoy";
  if (seg === "lotes" && sub === "nuevo") return "nuevo";
  if (seg === "cobros") return "cobros";
  if (seg === "produccion") return "produccion";
  return null;
}

export const TOUR_VERSION = 1;
export const seenKey = (key: TourKey) => `carretel.tour.${key}.v${TOUR_VERSION}`;
