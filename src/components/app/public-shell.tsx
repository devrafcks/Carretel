import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BrandLockup } from "@/components/brand/mark";
import { LocaleSwitch } from "./locale-switch";
import { buttonVariants } from "@/components/ui/button";
import { legal, legalValue } from "@/config/legal";

export async function PublicHeader({ loggedIn = false }: { loggedIn?: boolean }) {
  const t = await getTranslations("landing");
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="mr-auto inline-flex min-h-12 items-center" aria-label="Carretel">
          <BrandLockup />
        </Link>
        <Suspense>
          <LocaleSwitch />
        </Suspense>
        <Link href={loggedIn ? "/hoy" : "/entrar"} className={buttonVariants({ variant: "outline", size: "sm" })}>
          {t("login")}
        </Link>
      </div>
    </header>
  );
}

export async function PublicFooter() {
  const t = await getTranslations();
  const links = [
    ["/precios", t("landing.footerPricing")],
    ["/accesibilidad", t("landing.footerA11y")],
    ["/privacidad", t("landing.footerPrivacy")],
    ["/terminos", t("landing.footerTerms")],
    ["/quienes-somos", t("landing.footerAbout")],
  ] as const;
  return (
    <footer className="mt-16 border-t border-border bg-secondary text-secondary-foreground">
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8 sm:px-6">
        <nav aria-label={t("landing.footerAbout")}>
          <ul className="flex flex-wrap gap-x-5 gap-y-1">
            {links.map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="inline-flex min-h-12 items-center font-semibold underline-offset-4 hover:underline">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <hr className="stitch-rule" />
        <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
          <div className="flex gap-2">
            <dt className="font-semibold">{t("legal.company")}:</dt>
            <dd>{legalValue(legal.companyName)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold">{t("legal.cnpj")}:</dt>
            <dd className="tabular-money">{legalValue(legal.cnpj)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold">{t("legal.address")}:</dt>
            <dd>{legalValue(legal.address)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-semibold">{t("legal.email")}:</dt>
            <dd>{legalValue(legal.supportEmail)}</dd>
          </div>
        </dl>
        <p className="text-muted-foreground">© {new Date().getFullYear()} Carretel</p>
      </div>
    </footer>
  );
}
