import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, CircleCheck, Download, FileText, Languages, Package, Shield, Smartphone, Store, Wallet, WifiOff, type AppIcon } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import { legal } from "@/config/legal";

const PRINCIPLE_ICONS: AppIcon[] = [Languages, Smartphone, WifiOff, FileText, Shield, Download];

export default async function QuienesSomosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("aboutPage");
  const tl = await getTranslations("legal");
  const principles = t.raw("pr") as [string, string][];
  const pillars: { icon: AppIcon; title: string; body: string }[] = [
    { icon: Package, title: t("p1t"), body: t("p1b") },
    { icon: CircleCheck, title: t("p2t"), body: t("p2b") },
    { icon: Wallet, title: t("p3t"), body: t("p3b") },
  ];
  const company = (
    [
      [tl("cnpj"), legal.cnpj],
      [tl("email"), legal.supportEmail],
    ] as [string, string][]
  ).filter(([, v]) => v.trim() !== "");

  return (
    <div className="pb-24">
      {/* topo */}
      <section className="container-wide pt-14 sm:pt-20">
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-2 rounded-full bg-vivid" aria-hidden="true" />
          {t("kicker")}
        </p>
        <h1 className="text-hero mt-4 max-w-4xl text-5xl text-balance sm:text-7xl">
          {t("titleA")} <span className="text-vivid-strong">{t("titleB")}</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">{t("lead")}</p>
      </section>

      {/* o que fazemos */}
      <section className="container-wide mt-14 sm:mt-20">
        <div className="rounded-[2.5rem] bg-mint-soft p-6 sm:p-10">
          <p className="text-sm font-medium uppercase tracking-wide text-accent-foreground">{t("missionKicker")}</p>
          <p className="text-hero mt-3 max-w-3xl text-3xl sm:text-5xl">{t("mission")}</p>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {pillars.map((p, i) => (
              <li key={p.title} className="rounded-3xl bg-card p-6 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                    <p.icon aria-hidden="true" className="size-6" />
                  </span>
                  <span className="font-display text-4xl font-light text-ink/20 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h2 className="mt-5 text-xl font-medium">{p.title}</h2>
                <p className="mt-2 text-muted-foreground">{p.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* princípios */}
      <section className="container-wide mt-16 sm:mt-24">
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-2 rounded-full bg-vivid" aria-hidden="true" />
          {t("principlesKicker")}
        </p>
        <h2 className="text-hero mt-3 text-4xl sm:text-5xl">{t("principlesTitle")}</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {principles.map(([title, body], i) => {
            const Icon = PRINCIPLE_ICONS[i] ?? CircleCheck;
            return (
              <li key={title} className="rounded-3xl border border-ink/[0.06] bg-card p-6 shadow-soft">
                <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-mint-100 text-vivid-strong">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-medium">{title}</h3>
                <p className="mt-1.5 text-muted-foreground">{body}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* empresa + CTA */}
      <section className="container-wide mt-16 grid gap-4 sm:mt-24 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-3xl border border-ink/[0.06] bg-card p-6 shadow-soft sm:p-8">
          <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-mint-100 text-vivid-strong">
            <Store aria-hidden="true" className="size-5" />
          </span>
          <h2 className="mt-4 text-xl font-medium">{t("companyTitle")}</h2>
          <p className="mt-2 text-muted-foreground">{t("companyBody")}</p>
          {company.length ? (
            <dl className="mt-5 space-y-3 border-t border-ink/[0.06] pt-5">
              {company.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-sm text-muted-foreground">{k}</dt>
                  <dd className="font-medium tabular-money">{v}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
        <div className="flex flex-col justify-between gap-8 rounded-3xl bg-ink p-6 text-primary-foreground sm:p-10">
          <div>
            <h2 className="text-hero text-4xl sm:text-5xl">{t("ctaTitle")}</h2>
            <p className="mt-3 text-primary-foreground/75">{t("ctaBody")}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/entrar?conta=nova" className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-mint-200 px-7 font-medium text-ink transition-colors hover:bg-mint-100">
              {t("ctaStart")}
              <ArrowRight aria-hidden="true" className="size-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/calculadora" className="inline-flex min-h-13 items-center justify-center rounded-full border border-white/25 px-7 font-medium transition-colors hover:border-white/60">
              {t("ctaCalc")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
