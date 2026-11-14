import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CircleCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { BrandLockup } from "@/components/brand/mark";
import { LocaleSwitch } from "@/components/app/locale-switch";

export default async function AuthLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      {/* painel ilustrado (desktop) */}
      <aside className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col">
        <div className="absolute -right-24 -top-24 size-96 rounded-full border-[56px] border-white/5" aria-hidden="true" />
        <Link href="/" className="relative inline-flex min-h-12 items-center text-primary-foreground [&_span]:text-primary-foreground" aria-label="Carretel">
          <BrandLockup />
        </Link>
        <div className="relative my-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/illustrations/hero.svg" alt="" width={720} height={720} className="anim-float mx-auto w-full max-w-md rounded-[2.5rem] shadow-lift" />
          <h2 className="mt-10 font-display text-4xl font-extrabold leading-tight">
            {t("titleA")}
            <br />
            <span className="text-sun">{t("titleB")}</span>
          </h2>
          <ul className="mt-6 space-y-2">
            {[t("trust1"), t("trust2"), t("trust3")].map((s) => (
              <li key={s} className="flex items-center gap-2 font-semibold">
                <CircleCheck aria-hidden="true" className="size-5 text-sun" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="relative flex flex-col">
        <div className="bg-grid bg-grid-fade absolute inset-0" aria-hidden="true" />
        <header className="relative mx-auto flex w-full max-w-lg items-center justify-between px-4 py-3">
          <Link href="/" className="inline-flex min-h-12 items-center lg:invisible" aria-label="Carretel">
            <BrandLockup />
          </Link>
          <Suspense>
            <LocaleSwitch />
          </Suspense>
        </header>
        {/* faixa ilustrada (mobile) */}
        <div className="relative mx-auto w-full max-w-lg px-4 lg:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/illustrations/hero.svg" alt="" width={720} height={720} className="anim-pop h-40 w-full rounded-3xl object-cover object-[50%_35%] shadow-soft" />
        </div>
        <main id="conteudo" className="relative mx-auto w-full max-w-lg flex-1 px-4 pb-16 pt-5 lg:flex lg:flex-col lg:justify-center">
          <div className="anim-rise">{children}</div>
        </main>
      </div>
    </div>
  );
}
