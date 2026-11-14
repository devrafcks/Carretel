import { getTranslations, setRequestLocale } from "next-intl/server";
import { Camera, Mic, WifiOff, Languages, ShieldCheck, Calculator, CircleCheck, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BrandMark } from "@/components/brand/mark";
import { InstallHint } from "@/components/app/install-hint";

export default async function Landing({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  const tc = await getTranslations("common");

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1.15fr_1fr] md:py-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 font-semibold text-muted-foreground">
              <BrandMark className="size-5 text-primary" />
              {t("kicker")}
            </p>
            <h1 className="mt-4 font-display text-[2.125rem] font-bold leading-[1.1] tracking-tight sm:text-5xl">{t("title")}</h1>
            <p className="mt-4 max-w-xl text-lg">{t("lead")}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/entrar" className={buttonVariants({ size: "lg" })}>
                {t("ctaStart")}
              </Link>
              <Link href="/calculadora" className={buttonVariants({ size: "lg", variant: "outline" })}>
                <Calculator aria-hidden="true" />
                {t("ctaCalc")}
              </Link>
            </div>
            <p className="mt-4 text-muted-foreground">{t("priceNote")}</p>
          </div>

          {/* Mock do comprovante, com dados fictícios */}
          <div aria-hidden="true" className="relative mx-auto w-full max-w-sm">
            <Card className="ficha-corner rotate-[-1.5deg] p-5">
              <p className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Taller Rosa</p>
              <p className="mt-1 font-display text-xl font-bold">{locale === "es" ? "Comprobante de entrega" : "Comprovante de entrega"}</p>
              <hr className="stitch-rule my-4" />
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{tc("reference")}</dt>
                  <dd className="font-mono font-medium">1234</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">P · M · G</dt>
                  <dd className="tabular-money font-semibold">80 · 120 · 100</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{locale === "es" ? "Piezas" : "Peças"}</dt>
                  <dd className="tabular-money font-semibold">300</dd>
                </div>
                <div className="flex items-baseline justify-between border-t border-border pt-2">
                  <dt className="font-semibold">{tc("total")}</dt>
                  <dd className="tabular-money text-2xl font-bold">R$ 900,00</dd>
                </div>
              </dl>
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-paid-border bg-paid-bg px-3 py-2.5 font-semibold text-paid-fg">
                <CircleCheck className="size-5" />
                {locale === "es" ? "Confirmado por Carlos · 10:32" : "Confirmado por Carlos · 10:32"}
              </div>
              <p className="mt-3 font-mono text-sm text-muted-foreground">{tc("verificationCode")}: 9F2A61C0</p>
            </Card>
          </div>
        </div>
      </section>

      {/* 3 coisas */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">{t("featuresTitle")}</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {(
            [
              [Camera, t("f1Title"), t("f1Body")],
              [ShieldCheck, t("f2Title"), t("f2Body")],
              [Mic, t("f3Title"), t("f3Body")],
            ] as const
          ).map(([Icon, title, body], i) => (
            <li key={title}>
              <Card className="h-full p-5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary font-display text-lg font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <h3 className="font-display text-xl font-bold">{title}</h3>
                  <Icon aria-hidden="true" className="ml-auto size-6 text-primary" />
                </div>
                <p className="mt-3">{body}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* Antes / depois */}
      <section className="border-y border-border bg-secondary">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">{t("beforeAfterTitle")}</h2>
          <div className="mt-6 overflow-hidden rounded-lg border border-border bg-card">
            <div className="hidden grid-cols-2 border-b border-border bg-muted font-semibold sm:grid">
              <p className="px-4 py-3">{t("before")}</p>
              <p className="border-l border-border px-4 py-3">{t("after")}</p>
            </div>
            {(
              [
                [t("ba1Before"), t("ba1After")],
                [t("ba2Before"), t("ba2After")],
                [t("ba3Before"), t("ba3After")],
              ] as const
            ).map(([b, a]) => (
              <div key={b} className="grid border-b border-border last:border-0 sm:grid-cols-2">
                <p className="flex gap-2 px-4 py-3 text-muted-foreground">
                  <X aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
                  <span>
                    <span className="sr-only">{t("before")}: </span>
                    {b}
                  </span>
                </p>
                <p className="flex gap-2 border-t border-border px-4 py-3 font-semibold sm:border-l sm:border-t-0">
                  <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-paid-fg" />
                  <span>
                    <span className="sr-only">{t("after")}: </span>
                    {a}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conta, idioma, offline */}
      <section className="mx-auto grid max-w-5xl gap-4 px-4 py-12 sm:px-6 md:grid-cols-3">
        <Card className="border-primary p-5 md:col-span-1">
          <h2 className="font-display text-xl font-bold">{t("mathTitle")}</h2>
          <p className="mt-2">{t("mathBody")}</p>
          <p className="mt-2 text-muted-foreground">{t("mathNote")}</p>
        </Card>
        <Card className="p-5">
          <Languages aria-hidden="true" className="size-7 text-primary" />
          <h2 className="mt-2 font-display text-xl font-bold">{t("langTitle")}</h2>
          <p className="mt-2">{t("langBody")}</p>
        </Card>
        <Card className="p-5">
          <WifiOff aria-hidden="true" className="size-7 text-primary" />
          <h2 className="mt-2 font-display text-xl font-bold">{t("offlineTitle")}</h2>
          <p className="mt-2">{t("offlineBody")}</p>
        </Card>
      </section>

      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-5">
            <h2 className="font-display text-xl font-bold">{t("isNotTitle")}</h2>
            <p className="mt-2">{t("isNotBody")}</p>
          </Card>
          <InstallHint />
        </div>
        <div className="mt-10 flex flex-col items-start gap-3 rounded-lg bg-primary p-6 text-primary-foreground sm:flex-row sm:items-center">
          <p className="flex-1 font-display text-2xl font-bold">{t("priceNote")}</p>
          <Link href="/entrar" className={buttonVariants({ size: "lg", variant: "secondary" })}>
            {t("ctaStart")}
          </Link>
        </div>
      </section>
    </>
  );
}
