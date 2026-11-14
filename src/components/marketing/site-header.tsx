import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import { BrandLockup } from "@/components/brand/mark";
import { LocaleSwitch } from "@/components/app/locale-switch";

export async function SiteHeader() {
  const t = await getTranslations("landing");
  return (
    <header className="sticky top-0 z-[100] border-b border-ink/[0.05] bg-background/95">
      <div className="container-wide flex items-center gap-3 py-3">
        <Link href="/" className="mr-auto inline-flex min-h-12 items-center lg:mr-0" aria-label="Carretel">
          <BrandLockup />
        </Link>
        <nav aria-label="Carretel" className="mx-auto hidden items-center gap-8 text-[0.9375rem] text-muted-foreground lg:flex">
          <Link href="/#produto" className="hover:text-foreground">
            {t("demoKicker")}
          </Link>
          <Link href="/#como-funciona" className="hover:text-foreground">
            {t("navHow")}
          </Link>
          <Link href="/calculadora" className="hover:text-foreground">
            {t("navCalc")}
          </Link>
          <Link href="/#precios" className="hover:text-foreground">
            {t("navPricing")}
          </Link>
        </nav>
        <Suspense>
          <LocaleSwitch />
        </Suspense>
        <Link href="/entrar" className="hidden min-h-11 items-center rounded-full border border-ink/15 px-5 text-[0.9375rem] font-medium transition-colors hover:border-ink/40 sm:inline-flex">
          {t("login")}
        </Link>
        <Link href="/entrar?conta=nova" className="group hidden min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-[0.9375rem] font-medium text-primary-foreground transition-colors hover:bg-primary/85 sm:inline-flex">
          {t("ctaStart")}
          <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link href="/entrar" className="group inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-[0.9375rem] font-medium text-primary-foreground transition-colors hover:bg-primary/85 sm:hidden">
          {t("login")}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </header>
  );
}
