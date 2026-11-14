import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { BrandLockup } from "@/components/brand/mark";
import { LocaleSwitch } from "@/components/app/locale-switch";

export async function SiteHeader() {
  const t = await getTranslations("landing");
  return (
    <header className="sticky top-0 z-[100] border-b border-border/60 bg-background">
      <div className="container-wide flex items-center gap-3 py-3">
        <Link href="/" className="mr-auto inline-flex min-h-12 items-center" aria-label="Carretel">
          <BrandLockup />
        </Link>
        <nav aria-label="Carretel" className="hidden items-center gap-7 font-semibold text-muted-foreground lg:flex">
          <Link href="/#como-funciona" className="hover:text-foreground">
            {t("navHow")}
          </Link>
          <Link href="/calculadora" className="hover:text-foreground">
            {t("navCalc")}
          </Link>
          <Link href="/#precios" className="hover:text-foreground">
            {t("navPricing")}
          </Link>
          <Link href="/#faq" className="hover:text-foreground">
            {t("navFaq")}
          </Link>
        </nav>
        <Suspense>
          <LocaleSwitch />
        </Suspense>
        <Link href="/entrar" className="hidden min-h-12 items-center px-2 text-sm font-extrabold uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground sm:inline-flex">
          {t("login")}
        </Link>
        <Link
          href="/entrar"
          className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-5 text-sm font-extrabold uppercase tracking-[0.1em] text-primary-foreground shadow-soft transition-colors hover:bg-in-production-solid"
        >
          <span className="hidden sm:inline">{t("ctaStart")}</span>
          <span className="sm:hidden">{t("login")}</span>
          <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </header>
  );
}
