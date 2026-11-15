import { getTranslations, setRequestLocale } from "next-intl/server";
import { sortSizes } from "@/lib/utils";
import { notFound } from "next/navigation";
import { requireWorkshop } from "@/lib/session";
import { batchDetail } from "@/server/queries";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { StatusBadge, batchTone } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/dates";
import { appUrl } from "@/config/brand";
import { BatchActions, OperationsEditor, DeliveryList } from "./batch-client";

export default async function LoteDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const ctx = await requireWorkshop();
  const t = await getTranslations();
  const d = await batchDetail(ctx.tdb, id);
  if (!d) notFound();
  const b = d.batch;
  const producedByOp = new Map(d.produced.map((p) => [p.op, p.pieces]));
  const maxProduced = d.ops.length ? Math.max(0, ...d.ops.map((o) => producedByOp.get(o.id) ?? 0)) : 0;
  const remaining = Math.max(0, b.quantity - d.delivered);
  const recByProof = new Map(d.receivables.map((r) => [r.deliveryProofId, r]));

  return (
    <div className="space-y-5">
      <PageHeader
        tone="indigo"
        illustration={b.status === "delivered" || b.status === "closed" ? "/illustrations/comprove.svg" : "/illustrations/registre.svg"}
        kicker={t(`status.batch.${b.status}`)}
        title={t("batch.detailTitle", { ref: b.reference ?? t("batch.noRef") })}
        subtitle={`${d.client?.name ?? t("common.noClient")} · ${t("batch.received", { date: formatDate(b.createdAt, locale, { year: "numeric" }) })}`}
        backHref="/lotes"
        backLabel={t("common.back")}
      />

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusBadge tone={batchTone[b.status]!.tone} icon={batchTone[b.status]!.icon} label={t(`status.batch.${b.status}`)} />
          {b.dueDate ? <p className="font-semibold">{t("hoy.dueOn", { date: formatDate(b.dueDate, locale) })}</p> : null}
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          <div>
            <dt className="text-muted-foreground">{t("batch.quantity")}</dt>
            <dd className="tabular-money text-xl font-bold">{b.quantity}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("batch.price")}</dt>
            <dd className="text-xl font-bold">
              <Money cents={b.unitPriceCents} locale={locale} />
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("common.total")}</dt>
            <dd className="text-xl font-bold">
              <Money cents={b.totalCents} locale={locale} />
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("batch.delivered")}</dt>
            <dd className="tabular-money text-xl font-bold">
              {d.delivered} / {b.quantity}
            </dd>
          </div>
          {d.ops.length ? (
            <div>
              <dt className="text-muted-foreground">{t("batch.produced")}</dt>
              <dd className="tabular-money text-xl font-bold">{maxProduced}</dd>
            </div>
          ) : null}
          {b.color ? (
            <div>
              <dt className="text-muted-foreground">{t("batch.color")}</dt>
              <dd className="font-semibold">{b.color}</dd>
            </div>
          ) : null}
          <div className="col-span-2">
            <dt className="text-muted-foreground">{t("batch.supplies")}</dt>
            <dd className="font-semibold">
              {b.suppliesBy === "client" ? t("batch.suppliesClient") : t("batch.suppliesWorkshop")}
              {b.suppliesNote ? <span className="block font-normal">{b.suppliesNote}</span> : null}
            </dd>
          </div>
        </dl>
        {b.sizeGrid && Object.keys(b.sizeGrid).length ? (
          <ul className="mt-4 flex flex-wrap gap-2" aria-label={t("batch.grid")}>
            {sortSizes(b.sizeGrid).map(([k, v]) => (
              <li key={k} className="rounded-md border border-border bg-secondary px-3 py-1.5 font-semibold">
                {k} <span className="tabular-money">{v}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {b.photoIds.length ? (
          <div className="mt-4">
            <p className="text-muted-foreground">{t("batch.photos")}</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {b.photoIds.map((pid) => (
                <a key={pid} href={`/api/media/${pid}`} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/media/${pid}`} alt={t("batch.photo")} className="size-24 rounded-lg border border-border object-cover" />
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </Card>

      <BatchActions
        batchId={b.id}
        status={b.status}
        remaining={remaining}
        unitPriceCents={b.unitPriceCents}
        sizeGrid={b.sizeGrid}
        canWrite={ctx.access.canWrite}
        share={{
          baseUrl: appUrl(),
          workshopName: ctx.workshop.name,
          client: d.client ? { name: d.client.name, phone: d.client.phoneE164, locale: d.client.preferredLocale } : null,
          reference: b.reference,
        }}
      />

      <OperationsEditor batchId={b.id} ops={d.ops.map((o) => ({ id: o.id, machine: o.machine, rate: o.pieceRateCents, produced: producedByOp.get(o.id) ?? 0 }))} canWrite={ctx.access.canWrite} />

      <section aria-labelledby="deliveries">
        <h2 id="deliveries" className="mb-2 font-display">
          {t("batch.deliveries")}
        </h2>
        <DeliveryList
          baseUrl={appUrl()}
          workshopName={ctx.workshop.name}
          client={d.client ? { name: d.client.name, phone: d.client.phoneE164, locale: d.client.preferredLocale } : null}
          reference={b.reference}
          proofs={d.proofs.map((p) => ({
            id: p.id,
            token: p.publicToken,
            version: p.version,
            quantity: p.quantity,
            amountCents: p.amountCents,
            sizeGrid: p.sizeGrid,
            createdAt: p.createdAt.toISOString(),
            viewedAt: p.viewedAt?.toISOString() ?? null,
            confirmedAt: p.confirmedAt?.toISOString() ?? null,
            confirmedName: p.confirmedName,
            disputedAt: p.disputedAt?.toISOString() ?? null,
            disputedQuantity: p.disputedQuantity,
            disputedComment: p.disputedComment,
            revokedAt: p.revokedAt?.toISOString() ?? null,
            sha: p.contentSha256,
            payerClaimed: Boolean(recByProof.get(p.id)?.payerClaimedAt),
            batchId: b.id,
          }))}
        />
      </section>
    </div>
  );
}
