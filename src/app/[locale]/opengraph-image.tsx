import { ImageResponse } from "next/og";
import { OgCard, OG_SIZE, ogFonts } from "../../../brand/og-template";

export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "Carretel — Registra, Comprueba y Cobra / Registra, Comprova e Cobra";

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return new ImageResponse(<OgCard locale={locale} />, { ...OG_SIZE, fonts: await ogFonts() });
}
