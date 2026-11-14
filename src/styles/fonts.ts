/**
 * Tipografia: Montserrat (escolha do Rafael, 14/11/2026) no corpo e nos títulos;
 * IBM Plex Mono para ref. de lote, Pix, hash e token.
 * Montserrat tem dígitos tabulares via `tnum` → .tabular-money continua obrigatório em R$ e peças.
 */
import { Montserrat, IBM_Plex_Mono } from "next/font/google";

export const fontSans = Montserrat({
  subsets: ["latin", "latin-ext"],
  weight: "variable",
  style: ["normal", "italic"],
  variable: "--font-sans",
  display: "swap",
});

export const fontDisplay = Montserrat({
  subsets: ["latin", "latin-ext"],
  weight: "variable",
  variable: "--font-display",
  display: "swap",
});

export const fontMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-mono",
  display: "swap",
});
