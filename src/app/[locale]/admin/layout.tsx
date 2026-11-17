import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BrandMark } from "@/components/brand/mark";
import { requireAdmin } from "@/lib/admin";
import { ensureAuthAdminRole } from "@/db/admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin · Carretel", robots: { index: false, follow: false } };

/** Painel admin: só para os e-mails de ADMIN_EMAILS (os demais recebem 404). */
export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const admin = await requireAdmin();
  await ensureAuthAdminRole(admin.email);
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-[100] border-b border-ink/[0.06] bg-background/95">
        <div className="mx-auto flex max-w-[96rem] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/admin" className="inline-flex items-center gap-2 font-medium">
            <BrandMark className="size-7 text-primary" />
            Carretel <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">admin</span>
          </Link>
          <nav aria-label="Admin" className="ml-4 flex items-center gap-1 text-sm">
            <Link href="/admin" className="rounded-full px-3 py-1.5 hover:bg-mint-50">
              Visão geral
            </Link>
            <Link href="/admin/usuarios" className="rounded-full px-3 py-1.5 hover:bg-mint-50">
              Usuários
            </Link>
            <Link href="/admin/erros" className="rounded-full px-3 py-1.5 hover:bg-mint-50">
              Erros
            </Link>
          </nav>
          <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">{admin.email}</span>
          <Link href="/hoy" className="rounded-full border border-ink/15 px-4 py-1.5 text-sm hover:border-ink/40">
            Voltar ao app
          </Link>
        </div>
      </header>
      <main id="conteudo" className="mx-auto max-w-[96rem] px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
