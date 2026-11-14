import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Calculator, Check, CircleCheck, Plus, Sparkles, Banknote, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Reveal, CountUp } from "@/components/motion/reveal";
import { PhoneMockup } from "@/components/marketing/phone";
import { InstallHint } from "@/components/app/install-hint";
import { cn } from "@/lib/utils";

const pill =
  "group inline-flex min-h-14 items-center justify-center gap-2 rounded-full px-7 text-base font-extrabold transition-all";

export default async function Landing({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  const marquee = t.raw("marquee") as string[];
  const features = t.raw("planFeatures") as string[];
  const faq = t.raw("faq") as [string, string][];
  const shot = (name: string) => `/screenshots/${name}${locale === "pt-BR" ? "-pt" : ""}.png`;

  const steps = [
    { img: "/illustrations/registre.svg", title: t("f1Title"), body: t("f1Body"), tone: "bg-in-production-bg" },
    { img: "/illustrations/comprove.svg", title: t("f2Title"), body: t("f2Body"), tone: "bg-rework-bg" },
    { img: "/illustrations/cobre.svg", title: t("f3Title"), body: t("f3Body"), tone: "bg-paid-bg" },
  ];

  return (
    <>
      {/* ───────── HERO ───────── */}
      <section className="relative overflow-hidden">
        <div className="bg-grid bg-grid-fade absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-16">
          <div>
            <p className="anim-rise inline-flex items-center gap-2 rounded-full border border-paid-border bg-paid-bg px-3.5 py-1.5 text-sm font-bold text-paid-fg">
              <Sparkles aria-hidden="true" className="size-4" />
              {t("badge")}
            </p>
            <h1 className="mt-5 font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-tight text-balance sm:text-6xl lg:text-[4.25rem]">
              <span className="anim-rise delay-1 block">{t("titleA")}</span>
              <span className="anim-rise delay-2 block text-vivid">{t("titleB")}</span>
            </h1>
            <p className="anim-rise delay-3 mt-5 max-w-xl text-lg text-muted-foreground sm:text-xl">{t("lead")}</p>
            <div className="anim-rise delay-4 mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/entrar" className={cn(pill, "bg-primary text-primary-foreground shadow-soft hover:-translate-y-0.5 hover:shadow-lift")}>
                {t("ctaStart")}
                <ArrowRight aria-hidden="true" className="size-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/calculadora" className={cn(pill, "border-2 border-ink/15 bg-card text-foreground hover:border-ink/40")}>
                <Calculator aria-hidden="true" className="size-5" />
                {t("ctaCalc")}
              </Link>
            </div>
            <ul className="anim-rise delay-5 mt-8 grid grid-cols-2 gap-x-6 gap-y-2 sm:flex sm:flex-wrap">
              {[t("trust1"), t("trust2"), t("trust3"), t("trust4")].map((s) => (
                <li key={s} className="inline-flex items-center gap-2 font-semibold">
                  <span className="inline-flex size-6 items-center justify-center rounded-full bg-leaf text-primary-foreground">
                    <Check aria-hidden="true" className="size-4" strokeWidth={3} />
                  </span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* ilustração + cartões flutuantes */}
          <div className="relative mx-auto w-full max-w-[34rem]">
            <div className="anim-pop delay-2 overflow-hidden rounded-[2.5rem] shadow-lift">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/illustrations/hero.svg" alt="" width={720} height={720} className="block h-auto w-full" fetchPriority="high" />
            </div>
            <div className="anim-float absolute -left-3 top-8 sm:-left-10" aria-hidden="true">
              <div className="anim-pop delay-4 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-lift">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-paid-solid text-paid-solid-fg">
                  <CircleCheck className="size-6" />
                </span>
                <span>
                  <span className="block font-extrabold leading-tight">{t("floatConfirm")}</span>
                  <span className="block text-sm text-muted-foreground">{t("floatConfirmTime")}</span>
                </span>
              </div>
            </div>
            <div className="anim-float-tilt absolute -bottom-6 -right-2 sm:-right-8" aria-hidden="true">
              <div className="anim-pop delay-5 rounded-2xl bg-ink px-5 py-4 text-primary-foreground shadow-lift">
                <span className="flex items-center gap-2 text-sm font-bold text-sun">
                  <Banknote className="size-4" /> {t("floatPix")}
                </span>
                <span className="tabular-money mt-0.5 block text-3xl font-extrabold">R$ 900,00</span>
                <span className="block text-sm text-primary-foreground/70">{t("floatPieces")}</span>
              </div>
            </div>
            <Plus aria-hidden="true" className="anim-spin-slow absolute -top-4 right-10 size-8 text-vivid" strokeWidth={3} />
          </div>
        </div>
      </section>

      {/* ───────── MARQUEE ───────── */}
      <section aria-label={t("featuresTitle")} className="overflow-hidden border-y border-ink bg-ink py-5 text-primary-foreground">
        <div className="anim-marquee flex w-max gap-10 whitespace-nowrap">
          {[...marquee, ...marquee].map((m, i) => (
            <span key={i} className="inline-flex items-center gap-10 font-display text-2xl font-extrabold uppercase tracking-wide" aria-hidden={i >= marquee.length}>
              {m}
              <span className="text-sun" aria-hidden="true">
                - - -
              </span>
            </span>
          ))}
        </div>
      </section>

      {/* ───────── VITRINE DO PRODUTO ───────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal variant="scale">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-primary px-6 pt-12 text-primary-foreground sm:px-12 lg:px-16">
            <div className="absolute -right-24 -top-24 size-96 rounded-full border-[48px] border-white/5" aria-hidden="true" />
            <div className="absolute -bottom-32 -left-20 size-80 rounded-full bg-in-production-solid/40" aria-hidden="true" />
            <div className="relative grid items-end gap-10 lg:grid-cols-[1fr_1.15fr]">
              <div className="pb-12">
                <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-sun">{t("showKicker")}</p>
                <h2 className="mt-3 font-display text-4xl font-extrabold leading-tight sm:text-5xl">{t("showTitle")}</h2>
                <p className="mt-4 max-w-md text-lg text-primary-foreground/85">{t("showBody")}</p>
                <Link href="/entrar" className={cn(pill, "mt-8 bg-sun text-ink hover:-translate-y-0.5")}>
                  {t("ctaStart")}
                  <ArrowRight aria-hidden="true" className="size-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
              <div className="relative flex items-end justify-center gap-4 sm:gap-6">
                <Reveal delay={150} className="w-[46%] max-w-[15rem] translate-y-6">
                  <PhoneMockup src={shot("hoy")} alt={t("showTitle")} />
                </Reveal>
                <Reveal delay={300} className="w-[46%] max-w-[15rem]">
                  <PhoneMockup src={shot("comprobante")} alt={t("f2Title")} />
                </Reveal>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ───────── COMO FUNCIONA ───────── */}
      <section id="como-funciona" className="scroll-mt-20 bg-secondary/60 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-vivid-strong">{t("howKicker")}</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold leading-tight sm:text-5xl">
              {t("howTitleA")} <span className="text-vivid">{t("howTitleB")}</span>
            </h2>
          </Reveal>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 140}>
                <article className="lift h-full overflow-hidden rounded-[2rem] border border-border bg-card shadow-soft">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.img} alt="" width={480} height={480} loading="lazy" className="block aspect-[4/3] w-full object-cover" />
                  <div className="p-6">
                    <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-muted-foreground">{t("step", { n: i + 1 })}</p>
                    <h3 className="mt-1 font-display text-2xl font-extrabold">{s.title}</h3>
                    <p className="mt-2 text-muted-foreground">{s.body}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────── SEÇÃO ESCURA: ANTES / DEPOIS ───────── */}
      <section className="relative overflow-hidden bg-ink py-20 text-primary-foreground">
        <div className="absolute right-[-10rem] top-1/2 size-[36rem] -translate-y-1/2 rounded-full border border-white/10" aria-hidden="true" />
        <div className="absolute right-[-6rem] top-1/2 size-[28rem] -translate-y-1/2 rounded-full border border-white/10" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl gap-14 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <Reveal>
              <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-sun">{t("darkKicker")}</p>
              <h2 className="mt-3 font-display text-4xl font-extrabold leading-[1.05] sm:text-6xl">
                {t("darkTitleA")}
                <br />
                <span className="text-sun">{t("darkTitleB")}</span>
              </h2>
            </Reveal>
            <div className="relative mt-10">
              <Reveal variant="line" className="absolute bottom-2 left-[11px] top-2 w-0.5 bg-linear-to-b from-sun via-leaf to-transparent" />
              <ol className="space-y-8">
                {(
                  [
                    [t("ba1Before"), t("ba1After")],
                    [t("ba2Before"), t("ba2After")],
                    [t("ba3Before"), t("ba3After")],
                  ] as const
                ).map(([b, a], i) => (
                  <Reveal as="li" key={a} delay={i * 160} className="relative pl-10">
                    <span className="absolute left-0 top-1 inline-flex size-6 items-center justify-center rounded-full border-2 border-sun bg-ink" aria-hidden="true" />
                    <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-primary-foreground/60">{t("step", { n: i + 1 })}</p>
                    <p className="mt-1 text-primary-foreground/60 line-through decoration-vivid decoration-2">
                      <span className="sr-only">{t("before")}: </span>
                      {b}
                    </p>
                    <p className="mt-1 text-lg font-bold">
                      <span className="sr-only">{t("after")}: </span>
                      {a}
                    </p>
                  </Reveal>
                ))}
              </ol>
            </div>
          </div>
          <Reveal variant="scale" delay={200} className="self-center">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/illustrations/acerto.svg" alt="" width={480} height={480} loading="lazy" className="block aspect-[16/11] w-full object-cover" />
              <div className="p-7">
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-leaf text-primary-foreground">
                  <ShieldCheck aria-hidden="true" className="size-6" />
                </span>
                <h3 className="mt-4 font-display text-2xl font-extrabold">{t("darkCardTitle")}</h3>
                <p className="mt-2 text-primary-foreground/80">{t("darkCardBody")}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────── CALCULADORA ───────── */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
        <Reveal variant="scale" className="order-2 lg:order-1">
          <div className="anim-float overflow-hidden rounded-[2.5rem] shadow-lift">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/illustrations/calculadora.svg" alt="" width={480} height={480} loading="lazy" className="block h-auto w-full" />
          </div>
        </Reveal>
        <Reveal className="order-1 lg:order-2">
          <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-vivid-strong">{t("calcKicker")}</p>
          <h2 className="mt-3 font-display text-4xl font-extrabold leading-tight sm:text-5xl">
            {t("calcTitleA")} <span className="text-vivid">{t("calcTitleB")}</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{t("calcBody")}</p>
          <Link href="/calculadora" className={cn(pill, "mt-8 bg-primary text-primary-foreground shadow-soft hover:-translate-y-0.5 hover:shadow-lift")}>
            <Calculator aria-hidden="true" className="size-5" />
            {t("calcCta")}
          </Link>
        </Reveal>
      </section>

      {/* ───────── FATOS (sem estatística inventada: só fatos do produto) ───────── */}
      <section className="border-y border-border bg-card py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="sr-only">{t("factsTitle")}</h2>
          <dl className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {(
              [
                [20, "", t("fact1Label"), "text-primary"],
                [2, "", t("fact2Label"), "text-leaf"],
                [0, "", t("fact3Label"), "text-vivid"],
                [35, "R$ ", t("fact4Label"), "text-primary"],
              ] as const
            ).map(([n, prefix, label, color], i) => (
              <Reveal key={label} delay={i * 100} className="text-center">
                <dd className={cn("font-display text-5xl font-extrabold sm:text-6xl", color)}>
                  <CountUp to={n} prefix={prefix} />
                </dd>
                <dt className="mt-2 text-sm font-bold uppercase tracking-[0.1em] text-muted-foreground">{label}</dt>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* ───────── PREÇOS ───────── */}
      <section id="precios" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal className="text-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-vivid-strong">{t("pricingKicker")}</p>
            <h2 className="mt-3 font-display text-4xl font-extrabold leading-tight sm:text-5xl">
              {t("pricingTitleA")} <span className="text-vivid">{t("pricingTitleB")}</span>
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Reveal>
              <div className="lift flex h-full flex-col rounded-[2rem] border border-border bg-card p-8 shadow-soft">
                <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-muted-foreground">{t("planFreeName")}</p>
                <p className="mt-4 font-display text-5xl font-extrabold">{t("planFreePrice")}</p>
                <p className="mt-1 text-muted-foreground">{t("planFreeNote")}</p>
                <ul className="mt-6 space-y-3">
                  {features.slice(0, 4).map((f) => (
                    <li key={f} className="flex gap-3">
                      <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-leaf" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/entrar" className={cn(pill, "mt-auto border-2 border-ink/15 bg-card text-foreground hover:border-ink/40 [margin-top:2rem]")}>
                  {t("planFreeCta")}
                </Link>
              </div>
            </Reveal>
            <Reveal delay={150}>
              <div className="lift relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-primary p-8 text-primary-foreground shadow-lift">
                <span className="absolute right-6 top-6 rounded-full bg-sun px-3 py-1 text-xs font-extrabold uppercase tracking-[0.12em] text-ink">{t("planProBadge")}</span>
                <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-primary-foreground/70">{t("planProName")}</p>
                <p className="mt-4 font-display">
                  <span className="text-2xl font-bold">R$ </span>
                  <span className="tabular-money text-6xl font-extrabold">35</span>
                </p>
                <p className="mt-1 text-primary-foreground/80">{t("planProNote")}</p>
                <ul className="mt-6 space-y-3">
                  {features.map((f) => (
                    <li key={f} className="flex gap-3">
                      <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-sun" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/entrar" className={cn(pill, "mt-8 bg-sun text-ink hover:-translate-y-0.5")}>
                  {t("planProCta")}
                  <ArrowRight aria-hidden="true" className="size-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section id="faq" className="scroll-mt-20 bg-secondary/60 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Reveal>
            <h2 className="font-display text-4xl font-extrabold">{t("faqTitle")}</h2>
          </Reveal>
          <div className="mt-8 space-y-3">
            {faq.map(([q, a], i) => (
              <Reveal key={q} delay={i * 60}>
                <details className="group rounded-2xl border border-border bg-card px-5 shadow-soft open:shadow-lift">
                  <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold">
                    {q}
                    <Plus aria-hidden="true" className="size-6 shrink-0 text-vivid transition-transform group-open:rotate-45" />
                  </summary>
                  <p className="pb-5 text-muted-foreground">{a}</p>
                </details>
              </Reveal>
            ))}
          </div>
          <div className="mt-10">
            <InstallHint />
          </div>
        </div>
      </section>

      {/* ───────── CTA FINAL ───────── */}
      <section className="relative overflow-hidden py-24">
        <div className="bg-grid bg-grid-fade absolute inset-0" aria-hidden="true" />
        <Reveal className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl">
            {t("finalA")}
            <br />
            <span className="text-vivid">{t("finalB")}</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">{t("finalBody")}</p>
          <Link href="/entrar" className={cn(pill, "mt-10 bg-ink px-10 text-primary-foreground shadow-lift hover:-translate-y-0.5")}>
            {t("ctaStart")}
            <ArrowRight aria-hidden="true" className="size-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </section>
    </>
  );
}
