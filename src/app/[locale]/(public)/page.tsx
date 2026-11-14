import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ArrowRight,
  Calculator,
  Camera,
  Check,
  CircleCheck,
  Mic,
  Plus,
  QrCode,
  MessageCircle,
  LayoutGrid,
  Users,
  Wallet,
  ChartBar,
  Scissors,
} from "@/components/icons";
import { Link } from "@/i18n/navigation";
import { Reveal, CountUp } from "@/components/motion/reveal";
import { PhoneMockup } from "@/components/marketing/phone";
import { ThinBars, SplitBar } from "@/components/app/charts";
import { BrandMark } from "@/components/brand/mark";
import { cn } from "@/lib/utils";

const pill = "group inline-flex min-h-13 items-center justify-center gap-2 rounded-full px-7 text-base font-medium transition-colors";
const kicker = "inline-flex items-center gap-2 text-sm text-muted-foreground";

/* Dados de exemplo (fictícios) do painel de demonstração */
const DEMO_BARS = [120, 180, 90, 210, 260, 240, 0, 150, 300, 280, 310, 260, 330, 360];

export default async function Landing({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  const tc = await getTranslations("common");
  const features = t.raw("planFeatures") as string[];
  const faq = t.raw("faq") as [string, string][];
  const shot = (name: string) => `/screenshots/${name}${locale === "pt-BR" ? "-pt" : ""}.png`;
  const dot = <span className="size-2 rounded-full bg-vivid" aria-hidden="true" />;

  return (
    <>
      {/* ───────── HERO (ref.: título serifado centralizado, paisagem emoldurando as laterais) ───────── */}
      <section className="relative isolate overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustrations/hero-panorama.svg"
          alt=""
          width={1600}
          height={760}
          fetchPriority="high"
          className="anim-rise pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-60 w-full object-cover object-bottom sm:h-full"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_46%_58%_at_50%_42%,var(--background)_55%,transparent_100%)]"
        />
        <div className="container-wide flex min-h-[44rem] flex-col items-center pb-64 pt-16 text-center sm:min-h-[52rem] sm:pb-64 sm:pt-24">
          <h1 className="text-hero anim-rise delay-1 max-w-5xl text-[2.9rem] text-balance text-foreground sm:text-7xl xl:text-[5.5rem]">
            {t("titleA")} <span className="text-vivid-strong">{t("titleB")}</span>
          </h1>
          <p className="anim-rise delay-2 mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">{t("lead")}</p>
          <div className="anim-rise delay-3 mt-9 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
            <Link href="/entrar?conta=nova" className={cn(pill, "w-full bg-primary text-primary-foreground shadow-lift hover:bg-primary/85 sm:w-auto")}>
              {t("ctaStart")}
              <ArrowRight aria-hidden="true" className="size-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/calculadora" className={cn(pill, "w-full border border-ink/20 bg-card/80 hover:border-ink/50 sm:w-auto")}>
              {t("ctaCalc")}
            </Link>
          </div>
          <div className="anim-rise delay-4 mt-12">
            <p className="text-sm text-muted-foreground">{t("trustedBy")}</p>
            <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-[0.9375rem] text-foreground/80">
              {[t("trust1"), t("trust2"), t("trust3"), t("trust4")].map((s) => (
                <li key={s} className="inline-flex items-center gap-2">
                  <Check aria-hidden="true" className="size-4 text-vivid-strong" stroke={2} />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ───────── PAINEL DO PRODUTO (ref.: Aidency) ───────── */}
      <section id="produto" className="scroll-mt-20 py-20 sm:py-28">
        <div className="container-wide">
          <Reveal variant="scale">
            <div className="rounded-[2.5rem] bg-mint-soft p-3 sm:p-5">
              <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-[oklch(0.965_0.006_165)] shadow-lift">
                <div className="flex items-center gap-2 border-b border-ink/[0.06] px-5 py-3 text-sm">
                  <BrandMark className="size-6 text-primary" />
                  <span className="ml-1 font-medium">carretel</span>
                  <span className="ml-6 hidden rounded-t-xl bg-card px-4 py-1.5 font-medium shadow-soft sm:inline-block">{t("demoTitle")}</span>
                  <span className="hidden px-3 text-muted-foreground md:inline-block">{tc("today")}</span>
                  <span className="ml-auto inline-flex items-center gap-1.5 text-muted-foreground">
                    {dot}
                    {t("demoSample")}
                  </span>
                </div>
                <div className="grid gap-0 lg:grid-cols-[4.5rem_1fr]">
                  <div className="hidden flex-col items-center gap-3 border-r border-ink/[0.06] py-6 lg:flex" aria-hidden="true">
                    {[LayoutGrid, Scissors, Wallet, Users, ChartBar].map((I, i) => (
                      <span key={i} className={cn("inline-flex size-11 items-center justify-center rounded-2xl border", i === 0 ? "border-primary bg-primary text-primary-foreground" : "border-ink/10 bg-card")}>
                        <I className="size-5" />
                      </span>
                    ))}
                  </div>
                  <div className="p-5 sm:p-8 lg:p-10">
                    <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.1fr]">
                      <div>
                        <p className={kicker}>
                          {dot}
                          {t("demoKicker")}
                        </p>
                        <h2 className="mt-4 font-display text-4xl font-light uppercase leading-[1.02] tracking-tight sm:text-6xl">{t("demoTitle")}</h2>
                        <p className="mt-4 max-w-md text-muted-foreground">{t("demoBody")}</p>
                        <div className="mt-6 inline-flex items-center gap-3">
                          <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">TR</span>
                          <span className="font-medium">Taller Rosa</span>
                        </div>
                      </div>
                      <div className="relative mx-auto aspect-[4/3] w-full max-w-lg" aria-hidden="true">
                        <span className="bg-hatch absolute left-[8%] top-[16%] size-[44%] rounded-full" />
                        <span className="absolute right-[6%] top-[2%] size-[60%] rounded-full bg-mint-200/80" />
                        <span className="absolute bottom-[6%] left-[32%] size-[32%] rounded-full border border-white bg-white/80 shadow-soft" />
                        <div className="absolute left-0 top-0">
                          <p className="text-2xl font-light tabular-money sm:text-3xl">R$ 4.320</p>
                          <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                            {dot}
                            {t("demoOwed")}
                          </p>
                        </div>
                        <div className="absolute bottom-[10%] left-0">
                          <p className="text-2xl font-light tabular-money sm:text-3xl">12</p>
                          <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                            {dot}
                            {t("demoConfirmed")}
                          </p>
                        </div>
                        <div className="absolute bottom-0 right-0 text-right">
                          <p className="text-2xl font-light tabular-money sm:text-3xl">R$ 9.870</p>
                          <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                            {dot}
                            {t("demoCollected")}
                          </p>
                        </div>
                        <div className="absolute right-0 top-[10%] hidden w-44 rounded-2xl border border-ink/[0.06] bg-card p-4 shadow-soft sm:block">
                          <p className="text-sm font-medium">{t("demoTopClients")}</p>
                          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                            <li className="flex justify-between">
                              <span>Carlos</span>
                              <span className="tabular-money text-foreground">47%</span>
                            </li>
                            <li className="flex justify-between">
                              <span>Lua</span>
                              <span className="tabular-money text-foreground">20%</span>
                            </li>
                            <li className="flex justify-between">
                              <span>Bruma</span>
                              <span className="tabular-money text-foreground">7%</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="mt-10 grid gap-4 md:grid-cols-3">
                      <div className="rounded-3xl border border-ink/[0.06] bg-card p-5 shadow-soft md:col-span-2">
                        <div className="flex items-start justify-between">
                          <p className="text-muted-foreground">{t("demoPerDay")}</p>
                          <p className="text-2xl font-light tabular-money">360</p>
                        </div>
                        <ThinBars className="mt-4 h-24" values={DEMO_BARS} label={t("demoPerDay")} />
                      </div>
                      <div className="flex flex-col rounded-3xl border border-ink/[0.06] bg-card p-5 shadow-soft">
                        <p className="text-muted-foreground">{t("demoCollected")}</p>
                        <p className="mt-1 text-5xl font-light tabular-money">
                          64<span className="text-muted-foreground">,80 %</span>
                        </p>
                        <SplitBar className="mt-6" pct={64.8} />
                        <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                          <span className="size-2 rounded-full bg-overdue-calote" aria-hidden="true" />
                          {t("demoLate")}: 2
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────── COMO FUNCIONA: grade de blocos (ref.: quadro Aidency) ───────── */}
      <section id="como-funciona" className="scroll-mt-20 pb-20 sm:pb-28">
        <div className="container-wide">
          <Reveal className="max-w-3xl">
            <p className={kicker}>
              {dot}
              {t("bentoKicker")}
            </p>
            <h2 className="text-hero mt-4 text-4xl sm:text-6xl">
              {t("bentoTitleA")} <span className="text-muted-foreground">{t("bentoTitleB")}</span>
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-4 md:grid-cols-6">
            <Reveal className="md:col-span-3 lg:col-span-2">
              <div className="flex h-full min-h-48 flex-col justify-between rounded-[2rem] bg-ink p-7 text-primary-foreground">
                <div className="flex items-center gap-3">
                  <BrandMark className="size-10" accentClassName="text-sun" />
                  <span className="text-4xl font-light tracking-tight">carretel</span>
                </div>
                <p className="mt-6 text-primary-foreground/70">{t("footerTagline")}</p>
              </div>
            </Reveal>

            <Reveal delay={120} className="md:col-span-3 lg:col-span-2 lg:row-span-2">
              <div className="relative flex h-full min-h-[32rem] items-end justify-center overflow-hidden rounded-[2rem] bg-mint-soft px-8 pt-28">
                <div className="absolute left-7 top-7 max-w-[15rem]">
                  <p className="text-xl font-medium">{t("bentoAppTitle")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t("bentoAppBody")}</p>
                </div>
                <PhoneMockup src={shot("hoy")} alt={t("bentoAppTitle")} className="anim-float relative w-[15rem] translate-y-10 rotate-[-6deg]" />
              </div>
            </Reveal>

            <Reveal delay={60} className="md:col-span-3 lg:col-span-2">
              <article className="flex h-full flex-col rounded-[2rem] border border-ink/[0.06] bg-card p-7 shadow-soft">
                <p className="text-5xl font-extralight text-muted-foreground tabular-money">01</p>
                <h3 className="mt-4 text-2xl font-medium">{t("f1Title")}</h3>
                <p className="mt-2 text-muted-foreground">{t("f1Body")}</p>
                <div className="mt-auto grid grid-cols-4 gap-2 pt-6" aria-hidden="true">
                  {[Camera, Mic, LayoutGrid, Scissors].map((I, i) => (
                    <span key={i} className={cn("inline-flex aspect-square items-center justify-center rounded-2xl border", i === 0 ? "border-primary bg-primary text-primary-foreground" : "border-ink/10 bg-background")}>
                      <I className="size-6" />
                    </span>
                  ))}
                </div>
              </article>
            </Reveal>

            <Reveal delay={120} className="md:col-span-3 lg:col-span-2">
              <article className="flex h-full flex-col rounded-[2rem] border border-ink/[0.06] bg-card p-7 shadow-soft">
                <p className="text-5xl font-extralight text-muted-foreground tabular-money">02</p>
                <h3 className="mt-4 text-2xl font-medium">{t("f2Title")}</h3>
                <p className="mt-2 text-muted-foreground">{t("f2Body")}</p>
                <div className="mt-auto pt-6" aria-hidden="true">
                  <div className="flex items-center gap-3 rounded-2xl border border-mint-200 bg-mint-50 px-4 py-3">
                    <CircleCheck className="size-6 shrink-0 text-vivid-strong" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{t("floatConfirm")}</p>
                      <p className="text-sm text-muted-foreground">{t("floatConfirmTime")}</p>
                    </div>
                  </div>
                </div>
              </article>
            </Reveal>

            <Reveal delay={180} className="md:col-span-3 lg:col-span-2">
              <article className="flex h-full flex-col rounded-[2rem] border border-ink/[0.06] bg-card p-7 shadow-soft">
                <p className="text-5xl font-extralight text-muted-foreground tabular-money">03</p>
                <h3 className="mt-4 text-2xl font-medium">{t("f3Title")}</h3>
                <p className="mt-2 text-muted-foreground">{t("f3Body")}</p>
                <div className="mt-auto flex items-center gap-3 pt-6" aria-hidden="true">
                  <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-ink text-primary-foreground">
                    <QrCode className="size-7" />
                  </span>
                  <div>
                    <p className="text-2xl font-light tabular-money">R$ 900,00</p>
                    <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MessageCircle className="size-4" /> WhatsApp · Pix
                    </p>
                  </div>
                </div>
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────── ANTES / DEPOIS ───────── */}
      <section className="border-y border-ink/[0.05] bg-card py-20 sm:py-28">
        <div className="container-wide grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <p className={kicker}>
              {dot}
              {t("compareKicker")}
            </p>
            <h2 className="text-hero mt-4 text-4xl sm:text-6xl">{t("compareTitle")}</h2>
            <p className="mt-5 max-w-md text-muted-foreground">{t("mathBody")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t("mathNote")}</p>
          </Reveal>
          <ol className="divide-y divide-ink/[0.07]">
            {(
              [
                [t("ba1Before"), t("ba1After")],
                [t("ba2Before"), t("ba2After")],
                [t("ba3Before"), t("ba3After")],
              ] as const
            ).map(([b, a], i) => (
              <Reveal as="li" key={a} delay={i * 120} className="grid gap-3 py-7 first:pt-0 sm:grid-cols-[3rem_1fr_1fr] sm:gap-6">
                <span className="text-sm text-muted-foreground tabular-money">0{i + 1}</span>
                <p className="text-muted-foreground line-through decoration-ink/30">
                  <span className="sr-only">{t("before")}: </span>
                  {b}
                </p>
                <p className="flex gap-2 text-lg">
                  <span className="sr-only">{t("after")}: </span>
                  <Check aria-hidden="true" className="mt-1 size-5 shrink-0 text-vivid-strong" stroke={2} />
                  {a}
                </p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────── CALCULADORA + NÚMEROS ───────── */}
      <section className="py-20 sm:py-28">
        <div className="container-wide grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <p className={kicker}>
              {dot}
              {t("calcKicker")}
            </p>
            <h2 className="text-hero mt-4 text-4xl sm:text-6xl">
              {t("calcTitleA")} <span className="text-vivid-strong">{t("calcTitleB")}</span>
            </h2>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">{t("calcBody")}</p>
            <Link href="/calculadora" className={cn(pill, "mt-8 bg-primary text-primary-foreground hover:bg-primary/85")}>
              <Calculator aria-hidden="true" className="size-5" />
              {t("calcCta")}
            </Link>
          </Reveal>
          <Reveal variant="scale" delay={150}>
            <div className="rounded-[2.5rem] bg-mint-soft p-6 sm:p-10" aria-hidden="true">
              <div className="rounded-3xl bg-card p-6 shadow-lift">
                <p className="text-muted-foreground">300 × R$ 3,00</p>
                <p className="mt-1 text-5xl font-light tabular-money">+ R$ 240</p>
                <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
                  {[
                    ["R$ 0,18", "/ min"],
                    ["R$ 2,20", "/ pç"],
                    ["9,6", "pç / h"],
                  ].map(([v, l]) => (
                    <div key={l} className="rounded-2xl bg-background p-3">
                      <p className="text-lg font-medium tabular-money">{v}</p>
                      <p className="text-muted-foreground">{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
        <div className="container-wide mt-20">
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[2rem] border border-ink/[0.06] bg-ink/[0.06] md:grid-cols-4">
            {(
              [
                [20, "", t("fact1Label")],
                [2, "", t("fact2Label")],
                [0, "", t("fact3Label")],
                [35, "R$ ", t("fact4Label")],
              ] as const
            ).map(([n, prefix, label]) => (
              <div key={label} className="flex flex-col-reverse bg-card p-7 text-center">
                <dt className="mt-2 text-sm text-muted-foreground">{label}</dt>
                <dd className="text-5xl font-extralight sm:text-6xl">
                  <CountUp to={n} prefix={prefix} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ───────── PREÇOS ───────── */}
      <section id="precios" className="scroll-mt-20 bg-card py-20 sm:py-28">
        <div className="container-wide">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className={cn(kicker, "justify-center")}>
              {dot}
              {t("pricingKicker")}
            </p>
            <h2 className="text-hero mt-4 text-4xl sm:text-6xl">
              {t("pricingTitleA")} <span className="text-vivid-strong">{t("pricingTitleB")}</span>
            </h2>
          </Reveal>
          <div className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-2">
            <Reveal>
              <div className="flex h-full flex-col rounded-[2rem] border border-ink/[0.08] bg-background p-8">
                <p className="text-muted-foreground">{t("planFreeName")}</p>
                <p className="mt-3 text-5xl font-light">{t("planFreePrice")}</p>
                <p className="mt-1 text-muted-foreground">{t("planFreeNote")}</p>
                <ul className="mt-7 space-y-3">
                  {features.slice(0, 4).map((f) => (
                    <li key={f} className="flex gap-3">
                      <Check aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-vivid-strong" stroke={2} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/entrar?conta=nova" className={cn(pill, "mt-auto border border-ink/20 bg-card hover:border-ink/50 [margin-top:2.25rem]")}>
                  {t("planFreeCta")}
                </Link>
              </div>
            </Reveal>
            <Reveal delay={140}>
              <div className="relative flex h-full flex-col rounded-[2rem] bg-ink p-8 text-primary-foreground shadow-lift">
                <span className="absolute right-6 top-6 rounded-full bg-sun px-3 py-1 text-xs font-medium text-ink">{t("planProBadge")}</span>
                <p className="text-primary-foreground/70">{t("planProName")}</p>
                <p className="mt-3">
                  <span className="text-2xl font-light">R$ </span>
                  <span className="text-6xl font-light tabular-money">35</span>
                </p>
                <p className="mt-1 text-primary-foreground/70">{t("planProNote")}</p>
                <ul className="mt-7 space-y-3">
                  {features.map((f) => (
                    <li key={f} className="flex gap-3">
                      <Check aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-sun" stroke={2} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/entrar?conta=nova" className={cn(pill, "mt-9 bg-sun text-ink hover:bg-mint-200")}>
                  {t("planProCta")}
                  <ArrowRight aria-hidden="true" className="size-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section id="faq" className="scroll-mt-20 py-20 sm:py-28">
        <div className="container-wide grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal>
            <p className={kicker}>
              {dot}
              {t("navFaq")}
            </p>
            <h2 className="text-hero mt-4 text-4xl sm:text-6xl">{t("faqTitle")}</h2>
          </Reveal>
          <div className="divide-y divide-ink/[0.08] border-y border-ink/[0.08]">
            {faq.map(([q, a]) => (
              <details key={q} className="group">
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg font-medium">
                  {q}
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-ink/15 transition-transform group-open:rotate-45">
                    <Plus aria-hidden="true" className="size-4" />
                  </span>
                </summary>
                <p className="pb-6 pr-12 text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── CTA FINAL com a paisagem ───────── */}
      <section className="relative isolate overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/hero-panorama.svg" alt="" width={1600} height={760} loading="lazy" className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-full w-full object-cover object-bottom" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_44%_60%_at_50%_40%,var(--background)_55%,transparent_100%)]" />
        <Reveal className="container-wide flex min-h-[38rem] flex-col items-center justify-start pb-48 pt-24 text-center">
          <h2 className="text-hero max-w-4xl text-5xl text-balance sm:text-7xl">
            {t("finalA")} <span className="text-vivid-strong">{t("finalB")}</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">{t("finalBody")}</p>
          <Link href="/entrar?conta=nova" className={cn(pill, "mt-9 bg-primary px-9 text-primary-foreground shadow-lift hover:bg-primary/85")}>
            {t("ctaStart")}
            <ArrowRight aria-hidden="true" className="size-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </section>
    </>
  );
}
