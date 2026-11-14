import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Check } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import { BrandLockup } from "@/components/brand/mark";
import { LocaleSwitch } from "@/components/app/locale-switch";

export default async function AuthLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* painel com a paisagem de tecidos (computador) */}
      {/* fixo na altura da tela; o texto vem primeiro e a ilustração só ocupa o espaço que sobra embaixo (nunca por cima do texto) */}
      <aside className="sticky top-3 m-3 hidden h-[calc(100dvh-1.5rem)] flex-col overflow-hidden rounded-[2rem] bg-mint-soft lg:flex lg:self-start">
        <div className="shrink-0 px-10 pt-10">
          <Link href="/" className="inline-flex min-h-12 items-center" aria-label="Carretel">
            <BrandLockup />
          </Link>
        </div>
        <div className="mt-10 max-w-md shrink-0 px-10 xl:mt-14">
          <h2 className="text-hero text-4xl xl:text-5xl">
            {t("titleA")} <span className="text-vivid-strong">{t("titleB")}</span>
          </h2>
          <ul className="mt-7 space-y-2.5">
            {[t("trust1"), t("trust2"), t("trust3")].map((s) => (
              <li key={s} className="flex items-center gap-2.5">
                <Check aria-hidden="true" className="size-5 text-vivid-strong" stroke={2} />
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative mt-8 min-h-24 flex-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/illustrations/hero-panorama.svg" alt="" width={1600} height={760} className="anim-rise pointer-events-none absolute inset-0 size-full object-cover object-bottom" />
        </div>
      </aside>

      <div className="relative flex flex-col">
        <header className="relative mx-auto flex w-full max-w-lg items-center justify-between px-5 py-4">
          <Link href="/" className="inline-flex min-h-12 items-center lg:invisible" aria-label="Carretel">
            <BrandLockup />
          </Link>
          <Suspense>
            <LocaleSwitch />
          </Suspense>
        </header>
        <main id="conteudo" className="relative mx-auto w-full max-w-lg flex-1 px-5 pb-16 pt-6 lg:flex lg:flex-col lg:justify-center">
          <div className="anim-rise">{children}</div>
        </main>
      </div>
    </div>
  );
}
