import { setRequestLocale } from "next-intl/server";
import { loadWorkshopContext } from "@/lib/session";
import { AppShell } from "@/components/app/app-shell";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export const dynamic = "force-dynamic";

/** Calculadora: dentro do painel (com a sidebar) para quem está logado; página pública para os demais. */
export default async function CalcLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ctx = await loadWorkshopContext();
  if (ctx) return <AppShell ctx={ctx}>{children}</AppShell>;
  return (
    <>
      <SiteHeader />
      <main id="conteudo">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}
