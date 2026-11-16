import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Lock } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import { BrandLockup } from "@/components/brand/mark";
import { LocaleSwitch } from "@/components/app/locale-switch";
import { legal } from "@/config/legal";

/** Tela de checkout: fundo suave, cabeçalho enxuto e o formulário centralizado. */
export default async function CheckoutLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("subscribe");
  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden">
      {/* fundo: menta bem leve no topo e a paisagem de tecidos discreta embaixo */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_45%_at_50%_0%,var(--color-mint-100),transparent_70%)]" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/illustrations/hero-panorama.svg" alt="" width={1600} height={760} className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-56 w-full object-cover object-bottom opacity-25 sm:h-72" />

      <header className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-4 sm:px-6">
        <Link href="/" className="mr-auto inline-flex min-h-11 items-center" aria-label="Carretel">
          <BrandLockup />
        </Link>
        <span className="hidden items-center gap-1.5 rounded-full bg-card/80 px-3 py-1.5 text-sm text-muted-foreground shadow-soft sm:inline-flex">
          <Lock aria-hidden="true" className="size-4 text-vivid-strong" />
          {t("secureBadge")}
        </span>
        <Suspense>
          <LocaleSwitch />
        </Suspense>
      </header>

      <main id="conteudo" className="flex flex-1 items-start justify-center px-4 pb-16 pt-4 sm:px-6 sm:pt-8">
        {children}
      </main>

      <footer className="px-4 pb-6 text-center text-xs text-muted-foreground">
        {t("footer")}
        {legal.cnpj ? ` · CNPJ ${legal.cnpj}` : ""}
        {legal.supportEmail ? ` · ${legal.supportEmail}` : ""}
      </footer>
    </div>
  );
}
