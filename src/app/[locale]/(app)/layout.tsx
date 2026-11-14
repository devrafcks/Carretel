import { setRequestLocale, getTranslations } from "next-intl/server";
import { TriangleAlert } from "lucide-react";
import { requireWorkshop } from "@/lib/session";
import { TopBar } from "@/components/app/top-bar";
import { BottomNav } from "@/components/app/bottom-nav";
import { OfflineProvider } from "@/components/app/offline-provider";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ctx = await requireWorkshop();
  const t = await getTranslations("common");
  const limited = !ctx.access.canCreateBatch;
  return (
    <OfflineProvider workshopId={ctx.workshop.id}>
      <TopBar workshopName={ctx.workshop.name} />
      {limited ? (
        <div role="status" className="border-b border-overdue-calote-border bg-overdue-calote-bg text-overdue-calote-fg">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
            <TriangleAlert aria-hidden="true" className="size-5 shrink-0" />
            <p className="min-w-0 flex-1 font-semibold">
              {ctx.access.reason === "free_exhausted" ? t("errorFreeExhausted") : t("errorReadOnly")}
            </p>
            <Link href="/cuenta#plan" className={buttonVariants({ variant: "destructive", size: "sm" })}>
              {ctx.access.reason === "free_exhausted" ? t("activatePlan") : t("renew")}
            </Link>
          </div>
        </div>
      ) : null}
      <main id="conteudo" className="mx-auto w-full max-w-3xl px-4 pb-32 pt-4 sm:px-6">
        {children}
      </main>
      <BottomNav />
    </OfflineProvider>
  );
}
