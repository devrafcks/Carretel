import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireWorkshop } from "@/lib/session";
import { listClients } from "@/server/queries";
import { PageHeader } from "@/components/app/page-header";
import { NewBatchForm } from "./new-batch-form";
import { EmptyState } from "@/components/ui/empty-state";
import { FichaIllustration } from "@/components/brand/illustrations";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";

export default async function NuevoCortePage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ price?: string; qty?: string }> }) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const ctx = await requireWorkshop();
  const t = await getTranslations();
  const clients = await listClients(ctx.tdb);

  return (
    <div>
      <PageHeader tone="indigo" illustration="/illustrations/registre.svg" kicker={t("landing.f1Title")} title={t("batch.newTitle")} backHref="/hoy" backLabel={t("common.back")} />
      {!ctx.access.canCreateBatch ? (
        <EmptyState
          illustration={<FichaIllustration />}
          title={ctx.access.reason === "free_exhausted" ? t("batch.freeLimit") : t("common.errorReadOnly")}
          action={
            <Link href="/cuenta#plan" className={buttonVariants({ size: "lg", block: true })}>
              {ctx.access.reason === "free_exhausted" ? t("common.activatePlan") : t("common.renew")}
            </Link>
          }
        />
      ) : (
        <NewBatchForm
          clients={clients.map((c) => ({ id: c.id, name: c.name }))}
          initialPriceCents={sp.price ? Number(sp.price) || undefined : undefined}
          initialQuantity={sp.qty ? Number(sp.qty) || undefined : undefined}
        />
      )}
    </div>
  );
}
