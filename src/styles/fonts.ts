/**
 * Tipografia (14/11/2026, referências Aidency + landing de finanças):
 *  - Outfit: corpo, interface e títulos do app (geométrica, leve, números tabulares via `tnum`)
 *  - Young Serif: títulos grandes da landing (serifa editorial)
 *  - IBM Plex Mono: ref. de lote, Pix, hash e token
 */
import { Outfit, Young_Serif, IBM_Plex_Mono } from "next/font/google";

export const fontSans = Outfit({
  subsets: ["latin", "latin-ext"],
  weight: "variable",
  variable: "--font-sans",
  display: "swap",
});

export const fontDisplay = Outfit({
  subsets: ["latin", "latin-ext"],
  weight: "variable",
  variable: "--font-display",
  display: "swap",
});

export const fontSerif = Young_Serif({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  variable: "--font-serif",
  display: "swap",
});

export const fontMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-mono",
  display: "swap",
});
