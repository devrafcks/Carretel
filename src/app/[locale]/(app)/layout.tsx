import { setRequestLocale, getTranslations } from "next-intl/server";
import { TriangleAlert } from "@/components/icons";
import { requireWorkshop } from "@/lib/session";
import { TopBar } from "@/components/app/top-bar";
import { BottomNav, SideRail } from "@/components/app/bottom-nav";
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
      <div className="flex min-h-dvh">
        <SideRail />
        <div className="min-w-0 flex-1">
          <TopBar workshopName={ctx.workshop.name} />
          {limited ? (
            <div role="status" className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-10">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-mint-200 bg-mint-50 px-4 py-3 text-foreground">
                <TriangleAlert aria-hidden="true" className="size-5 shrink-0 text-vivid-strong" />
                <p className="min-w-0 flex-1">{ctx.access.reason === "free_exhausted" ? t("errorFreeExhausted") : t("errorReadOnly")}</p>
                <Link href="/cuenta#plan" className={buttonVariants({ size: "sm" })}>
                  {ctx.access.reason === "free_exhausted" ? t("activatePlan") : t("renew")}
                </Link>
              </div>
            </div>
          ) : null}
          <main id="conteudo" className="mx-auto w-full max-w-7xl px-4 pb-32 pt-6 sm:px-6 lg:px-10 lg:pb-16">
            {children}
          </main>
        </div>
      </div>
      <BottomNav />
    </OfflineProvider>
  );
}
