import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireWorkshop } from "@/lib/session";
import { receivablesBoard } from "@/server/queries";
import { PageHeader } from "@/components/app/page-header";
import { Money } from "@/components/ui/money";
import { Card, Notice } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { NeedleIllustration } from "@/components/brand/illustrations";
import { buildPixBrCode } from "@/lib/pix-brcode";
import { formatDate } from "@/lib/dates";
import { appUrl } from "@/config/brand";
import { ReceivableList, AgingBars } from "./cobros-client";
import { Info } from "@/components/icons";

export default async function CobrosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ctx = await requireWorkshop();
  const t = await getTranslations();
  const board = await receivablesBoard(ctx.tdb);
  const ws = ctx.workshop;
  const hasPix = Boolean(ws.pixKey && ws.pixMerchantName && ws.pixCity);

  const items = board.open.map((i) => {
    let pix: string | null = null;
    let pixError = false;
    if (hasPix) {
      try {
        pix = buildPixBrCode({
          key: ws.pixKey!,
          merchantName: ws.pixMerchantName!,
          merchantCity: ws.pixCity!,
          amountCents: i.openCents,
          txid: "CRT" + i.receivable.id.replace(/-/g, "").slice(0, 20),
        });
      } catch {
        pixError = true;
      }
    }
    const clientLocale = (i.client?.preferredLocale ?? "pt-BR") as "es" | "pt-BR";
    return {
      id: i.receivable.id,
      clientName: i.client?.name ?? t("common.noClient"),
      clientPhone: i.client?.phoneE164 ?? null,
      clientLocale,
      reference: i.batch.reference,
      batchId: i.batch.id,
      status: i.receivable.status,
      amountCents: i.receivable.amountCents,
      openCents: i.openCents,
      days: i.days,
      issuedOn: formatDate(i.receivable.issuedOn, clientLocale),
      proofUrl: `${appUrl()}/${clientLocale}/c/${i.proof.publicToken}`,
      viewed: Boolean(i.proof.viewedAt),
      confirmed: Boolean(i.proof.confirmedAt),
      disputed: Boolean(i.proof.disputedAt),
      payerClaimed: Boolean(i.receivable.payerClaimedAt),
      pix,
      pixError,
    };
  });

  return (
    <div className="space-y-5">
      <PageHeader
        tone="ink"
        illustration="/illustrations/cobre.svg"
        kicker={t("cobros.title")}
        title={<Money cents={board.totalOpenCents} locale={locale} className="text-4xl sm:text-5xl" />}
        subtitle={t("hoy.owedSub", { count: board.open.length })}
      />
      {board.totalOpenCents > 0 ? (
        <Card className="anim-rise delay-1 p-5">
          <AgingBars buckets={board.buckets} total={board.totalOpenCents} />
        </Card>
      ) : null}

      {!ctx.access.canWrite ? (
        <Notice tone="info" icon={<Info />}>
          <p>{t("cobros.readOnlyNote")}</p>
        </Notice>
      ) : null}
      {!hasPix && items.length > 0 ? (
        <Notice tone="warning">
          <p>{t("cobros.pixError")}</p>
        </Notice>
      ) : null}

      {items.length === 0 ? (
        <EmptyState illustration={<NeedleIllustration />} title={t("cobros.empty")} />
      ) : (
        <ReceivableList items={items} workshopName={ws.name} canWrite={ctx.access.canWrite} canMarkPaid={ctx.access.canMarkPaid} />
      )}

      {board.paid.length ? (
        <section aria-labelledby="paid">
          <h2 id="paid" className="mb-2 font-display">
            {t("cobros.paidRecently")}
          </h2>
          <ul className="anim-rise divide-y divide-border overflow-hidden rounded-2xl border border-ink/10 bg-card shadow-soft">
            {board.paid.map((p) => (
              <li key={p.receivable.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0 truncate">
                  {p.client?.name ?? t("common.noClient")} {p.batch.reference ? `· ${t("common.reference")} ${p.batch.reference}` : ""}
                </span>
                <Money cents={p.receivable.amountCents} locale={locale} className="font-semibold" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
