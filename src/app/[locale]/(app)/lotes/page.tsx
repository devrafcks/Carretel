import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChevronRight } from "lucide-react";
import { requireWorkshop } from "@/lib/session";
import { listBatches } from "@/server/queries";
import { PageHeader } from "@/components/app/page-header";
import { Link } from "@/i18n/navigation";
import { Money } from "@/components/ui/money";
import { StatusBadge, batchTone } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SpoolIllustration } from "@/components/brand/illustrations";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

export default async function LotesPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ f?: string }> }) {
  const { locale } = await params;
  const { f } = await searchParams;
  setRequestLocale(locale);
  const ctx = await requireWorkshop();
  const t = await getTranslations();
  const showAll = f === "all";
  const rows = await listBatches(ctx.tdb, { status: showAll ? undefined : ["received", "in_production", "ready", "delivered"], limit: 200 });

  return (
    <div>
      <PageHeader
        title={t("batch.listTitle")}
        backHref="/hoy"
        backLabel={t("common.back")}
        action={
          <Link href="/lotes/nuevo" className={buttonVariants({ size: "sm" })}>
            {t("hoy.emptyCta")}
          </Link>
        }
      />
      <div role="group" className="mb-4 inline-flex rounded-lg border border-border bg-card p-0.5">
        {(
          [
            ["open", t("batch.filterOpen")],
            ["all", t("batch.filterAll")],
          ] as const
        ).map(([k, label]) => (
          <Link
            key={k}
            href={k === "all" ? "/lotes?f=all" : "/lotes"}
            aria-current={(k === "all") === showAll ? "page" : undefined}
            className={cn("inline-flex min-h-11 items-center rounded-md px-4 font-semibold", (k === "all") === showAll ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
          >
            {label}
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState
          illustration={<SpoolIllustration />}
          title={t("hoy.empty")}
          action={
            <Link href="/lotes/nuevo" className={buttonVariants({ size: "lg", block: true })}>
              {t("hoy.emptyCta")}
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {rows.map(({ batch: b, clientName }) => (
            <li key={b.id}>
              <Link href={`/lotes/${b.id}`} className="flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-muted">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {clientName ?? t("common.noClient")} · {b.reference ? `${t("common.reference")} ${b.reference}` : t("batch.noRef")}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="tabular-money">{t("common.pieces", { count: b.quantity })}</span> · <Money cents={b.totalCents} locale={locale} className="text-foreground" />
                    {b.dueDate ? <> · {t("hoy.dueOn", { date: formatDate(b.dueDate, locale) })}</> : null}
                  </p>
                </div>
                <StatusBadge tone={batchTone[b.status]!.tone} icon={batchTone[b.status]!.icon} label={t(`status.batch.${b.status}`)} />
                <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
