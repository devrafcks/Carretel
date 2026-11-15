import type { MetadataRoute } from "next";
import { appUrl } from "@/config/brand";

/** Páginas públicas nos dois idiomas, com o par de idioma indicado para os buscadores. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = appUrl();
  const pages = ["", "/entrar", "/privacidad", "/terminos", "/quienes-somos", "/accesibilidad"];
  const now = new Date();
  return pages.flatMap((p) =>
    (["pt-BR", "es"] as const).map((l) => ({
      url: `${base}/${l}${p}`,
      lastModified: now,
      changeFrequency: p === "" ? ("weekly" as const) : ("monthly" as const),
      priority: p === "" ? 1 : 0.5,
      alternates: { languages: { "pt-BR": `${base}/pt-BR${p}`, es: `${base}/es${p}` } },
    })),
  );
}
