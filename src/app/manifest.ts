import type { MetadataRoute } from "next";
import { BRAND_HEX } from "@/config/brand-colors";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/?source=pwa",
    name: "Carretel — Registra, Comprueba y Cobra",
    short_name: "Carretel",
    description: "El cuaderno de su taller / O caderno do seu taller. Registre, compruebe y cobre.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: BRAND_HEX.background,
    theme_color: BRAND_HEX.primary,
    lang: "es",
    categories: ["business", "productivity", "finance"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Nuevo lote / Novo lote", short_name: "Corte", url: "/es/lotes/nuevo", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Cobrar", short_name: "Cobrar", url: "/es/cobros", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
    screenshots: [
      { src: "/screenshots/hoy.png", sizes: "390x844", type: "image/png", form_factor: "narrow", label: "Hoy — Taller Rosa (datos ficticios)" },
      { src: "/screenshots/comprobante.png", sizes: "390x844", type: "image/png", form_factor: "narrow", label: "Comprobante de entrega (datos ficticios)" },
    ],
  };
}
