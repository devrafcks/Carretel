import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BrandLockup } from "@/components/brand/mark";
import { legal, legalValue } from "@/config/legal";

export async function SiteFooter() {
  const t = await getTranslations();
  const cols = [
    {
      title: "Carretel",
      links: [
        ["/#como-funciona", t("landing.navHow")],
        ["/calculadora", t("landing.navCalc")],
        ["/precios", t("landing.footerPricing")],
        ["/entrar", t("landing.login")],
      ],
    },
    {
      title: t("landing.footerAbout"),
      links: [
        ["/quienes-somos", t("landing.footerAbout")],
        ["/accesibilidad", t("landing.footerA11y")],
      ],
    },
    {
      title: "Legal",
      links: [
        ["/privacidad", t("landing.footerPrivacy")],
        ["/terminos", t("landing.footerTerms")],
      ],
    },
  ] as const;
  return (
    <footer className="bg-ink text-primary-foreground">
      <div className="container-wide grid gap-10 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <BrandLockup inverted />
          <p className="mt-3 max-w-xs text-primary-foreground/80">{t("landing.footerTagline")}</p>
          <div className="stitch-animated mt-5 w-40 text-sun" aria-hidden="true" />
        </div>
        {cols.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-sun">{c.title}</p>
            <ul className="mt-3 space-y-1">
              {c.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="inline-flex min-h-11 items-center text-primary-foreground/85 hover:text-primary-foreground hover:underline underline-offset-4">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10">
        <dl className="container-wide flex flex-wrap gap-x-6 gap-y-1 py-5 text-sm text-primary-foreground/70">
          <div className="flex gap-1.5">
            <dt>{t("legal.company")}:</dt>
            <dd>{legalValue(legal.companyName)}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt>{t("legal.cnpj")}:</dt>
            <dd>{legalValue(legal.cnpj)}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt>{t("legal.email")}:</dt>
            <dd>{legalValue(legal.supportEmail)}</dd>
          </div>
          <div className="ml-auto">© {new Date().getFullYear()} Carretel</div>
        </dl>
      </div>
    </footer>
  );
}
