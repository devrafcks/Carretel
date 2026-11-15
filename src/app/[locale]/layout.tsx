import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Toaster } from "sonner";
import { SeebPosition } from "@/components/app/seeb-position";
import { routing } from "@/i18n/routing";
import { fontSans, fontDisplay, fontMono, fontSerif } from "@/styles/fonts";
import { ServiceWorkerRegister } from "@/components/app/sw-register";
import { appUrl } from "@/config/brand";
import { BRAND_HEX } from "@/config/brand-colors";
import "@/styles/globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(appUrl()),
    title: { default: t("title"), template: "%s · Carretel" },
    description: t("description"),
    applicationName: "Carretel",
    appleWebApp: { capable: true, title: "Carretel", statusBarStyle: "default" },
    alternates: { languages: { es: "/es", "pt-BR": "/pt-BR" } },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: BRAND_HEX.primary },
    { media: "(prefers-color-scheme: dark)", color: BRAND_HEX.darkBackground },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "common" });
  return (
    <html lang={locale} suppressHydrationWarning className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable} ${fontSerif.variable}`}>
      {/* variáveis de fonte também no <body>: o :root de tokens.css redefine --font-sans e venceria a classe do <html> */}
      <body className={`${fontSans.variable} ${fontDisplay.variable} ${fontMono.variable} ${fontSerif.variable}`}>
        {/* Âncora estável: o SeeB tira #app do <body>; nós que o React insere no <body> (metadata do Next)
            precisam de um irmão que continue no <body>, senão insertBefore quebra (NotFoundError). */}
        <span id="app-anchor" hidden />
        {/* Raiz única e estável: o SeeB move SÓ este nó para #seeb-content-wrapper.
            font-sans aqui mantém Montserrat no conteúdo mesmo com a fonte do widget ativa por padrão. */}
        <div id="app" className="min-h-dvh font-sans">
          <a
            href="#conteudo"
            className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[9990] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-3 focus:text-primary-foreground"
          >
            {t("skipToContent")}
          </a>
          <NextIntlClientProvider>
            {children}
            <Toaster
              position="top-center"
              closeButton
              toastOptions={{
                className: "!rounded-lg !border !border-border !bg-popover !text-popover-foreground !font-sans !text-base",
              }}
            />
            {/* Raiz de portais DENTRO de #app: filtros e leitor de voz alcançam modais e toasts */}
            <div id="portal-root" />
          </NextIntlClientProvider>
          <ServiceWorkerRegister />
          <SeebPosition />
        </div>
        <Script src={process.env.NEXT_PUBLIC_SEEB_WIDGET_URL ?? "https://seeb-widget.pages.dev/widget.js"} strategy="lazyOnload" />
      </body>
    </html>
  );
}
