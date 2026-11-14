import { setRequestLocale } from "next-intl/server";
import { PublicFooter, PublicHeader } from "@/components/app/public-shell";

export default async function PublicLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <PublicHeader />
      <main id="conteudo">{children}</main>
      <PublicFooter />
    </>
  );
}
