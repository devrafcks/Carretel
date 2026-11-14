import { defineRouting } from "next-intl/routing";

export const locales = ["es", "pt-BR"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "es",
  localePrefix: "always",
  localeCookie: { name: "NEXT_LOCALE", maxAge: 60 * 60 * 24 * 365 },
});

export function isLocale(v: string): v is Locale {
  return (locales as readonly string[]).includes(v);
}
