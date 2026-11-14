import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BrandLockup } from "@/components/brand/mark";
import { LocaleSwitch } from "@/components/app/locale-switch";

export default async function AuthLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <Link href="/" className="inline-flex min-h-12 items-center" aria-label="Carretel">
          <BrandLockup />
        </Link>
        <Suspense>
          <LocaleSwitch />
        </Suspense>
      </header>
      <main id="conteudo" className="mx-auto max-w-lg px-4 pb-16 pt-4">
        {children}
      </main>
    </div>
  );
}
