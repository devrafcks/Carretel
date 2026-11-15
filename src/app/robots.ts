import type { MetadataRoute } from "next";
import { appUrl } from "@/config/brand";

/** Buscadores: só as páginas públicas. Painel, admin, API e links de comprovante ficam de fora. */
export default function robots(): MetadataRoute.Robots {
  const privatePaths = ["hoy", "lotes", "produccion", "cobros", "cuenta", "mas", "clientes", "bienvenida", "calculadora", "notificaciones", "relatorios", "faccao", "admin", "assinar", "c/", "r/", "go-live"];
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", ...["es", "pt-BR"].flatMap((l) => privatePaths.map((p) => `/${l}/${p}`))],
    },
    sitemap: `${appUrl()}/sitemap.xml`,
  };
}
