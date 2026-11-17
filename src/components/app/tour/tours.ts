/**
 * Tours guiados por tela. Cada passo aponta para um ou mais seletores (o primeiro VISÍVEL ganha:
 * no celular a barra de baixo, no computador a lateral). Sem seletor = passo centralizado (boas-vindas).
 * Os textos ficam em messages (namespace "tour").
 */
export type TourKey =
  | "hoy"
  | "nuevo"
  | "cobros"
  | "produccion"
  | "lotes"
  | "lote"
  | "clientes"
  | "mas"
  | "cuenta"
  | "relatorios"
  | "calculadora"
  | "notificaciones"
  | "faccao";

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
  lotes: [
    { id: "filter", selectors: ['main [role="group"]'], side: "bottom", align: "start" },
    { id: "list", selectors: ["main ul > li:first-child"], side: "bottom" },
    { id: "new", selectors: ['main a[href$="/lotes/nuevo"]'], side: "bottom", align: "end" },
    { id: "excel", selectors: ['main a[href*="/api/export/xlsx"]', 'main a[href$="/assinar"]'], side: "bottom", align: "end" },
  ],
  lote: [
    { id: "summary", selectors: ["main dl"], side: "bottom" },
    { id: "actions", selectors: ['[data-tour="batch-actions"] .order-first', '[data-tour="batch-actions"]'], side: "bottom" },
    { id: "operations", selectors: ['[data-tour="batch-operations"]'], side: "top" },
    { id: "deliveries", selectors: ["#deliveries"], side: "top", align: "start" },
  ],
  clientes: [
    { id: "new", selectors: ['[data-tour="clients-new"]'], side: "bottom", align: "start" },
    { id: "card", selectors: ["main ul > li:first-child"], side: "bottom" },
    { id: "excel", selectors: ['main a[href*="/api/export/xlsx"]', 'main a[href$="/assinar"]'], side: "bottom", align: "end" },
  ],
  mas: [
    { id: "account", selectors: ['main a[href$="/cuenta"]'], side: "bottom" },
    { id: "workshop", selectors: ['main ul:has(a[href$="/clientes"])'], side: "top" },
    { id: "help", selectors: ['main ul:has(a[href$="/privacidad"])'], side: "top" },
  ],
  cuenta: [
    { id: "plan", selectors: ["#plan"], side: "bottom" },
    { id: "data", selectors: ["main h2:has(~ form #wdoct)", "main form:has(#wdoct)"], side: "bottom", align: "start" },
    { id: "pix", selectors: ["main h2:has(~ form #ptype)", "main form:has(#ptype)"], side: "bottom", align: "start" },
    { id: "settle", selectors: ["main h2:has(~ form #sp)", "main form:has(#sp)"], side: "bottom", align: "start" },
  ],
  relatorios: [
    { id: "month", selectors: ["main dl"], side: "bottom" },
    { id: "charts", selectors: ["main figure"], side: "top" },
    { id: "excel", selectors: ['main a[href*="/api/export/xlsx"]', 'main a[href$="/assinar"]'], side: "bottom", align: "start" },
  ],
  calculadora: [
    { id: "offer", selectors: ["#op"], side: "bottom" },
    { id: "pace", selectors: ["#pc"], side: "bottom" },
    { id: "result", selectors: ['[data-tour="calc-result"]'], side: "left" },
    { id: "costs", selectors: ['[data-tour="calc-costs"]'], side: "top" },
  ],
  notificaciones: [
    { id: "list", selectors: ['[data-tour="notif-list"]'], side: "bottom" },
    { id: "actions", selectors: ['[data-tour="notif-actions"]'], side: "bottom", align: "end" },
  ],
  faccao: [
    { id: "new", selectors: ['main div:has(> [role="group"]) > button'], side: "bottom", align: "start" },
    { id: "filter", selectors: ['main [role="group"]'], side: "bottom", align: "end" },
    { id: "card", selectors: ["main ul > li:first-child"], side: "bottom" },
  ],
};

/** Elemento DA PÁGINA que indica que o conteúdo já chegou (o painel aparece antes, por streaming). */
export const READY: Record<TourKey, string> = {
  hoy: '[data-tour="hoy-new-batch"]',
  nuevo: "#client",
  cobros: "main h1",
  produccion: '[role="tablist"]',
  lotes: 'main [role="group"]',
  lote: '[data-tour="batch-operations"]',
  clientes: "main h1",
  mas: 'main a[href$="/cuenta"]',
  cuenta: "#plan",
  relatorios: "main dl",
  calculadora: "#op",
  notificaciones: '[data-tour="notif-actions"]',
  faccao: 'main [role="group"]',
};

/** Qual tour vale para o caminho atual (/pt-BR/hoy, /es/lotes/nuevo, ...). */
export function tourForPath(pathname: string): TourKey | null {
  const parts = pathname.split("/").filter(Boolean); // [locale, segment, ...]
  const [, seg, sub] = parts;
  if (seg === "lotes") return sub === "nuevo" ? "nuevo" : sub ? "lote" : "lotes";
  const direct: Record<string, TourKey> = {
    hoy: "hoy",
    cobros: "cobros",
    produccion: "produccion",
    clientes: "clientes",
    mas: "mas",
    cuenta: "cuenta",
    relatorios: "relatorios",
    calculadora: "calculadora",
    notificaciones: "notificaciones",
    faccao: "faccao",
  };
  return seg ? (direct[seg] ?? null) : null;
}

export const TOUR_VERSION = 1;
export const seenKey = (key: TourKey) => `carretel.tour.${key}.v${TOUR_VERSION}`;
