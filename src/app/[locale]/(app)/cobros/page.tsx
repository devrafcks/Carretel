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
import { formatBRL } from "@/lib/money";
import { appUrl } from "@/config/brand";
import { ReceivableList, AgingBars } from "./cobros-client";
import { Info, QrCode, ChevronDown } from "@/components/icons";
import { PixForm } from "../cuenta/account-client";

export default async function CobrosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ctx = await requireWorkshop();
  const t = await getTranslations();
  const board = await receivablesBoard(ctx.tdb);
  const ws = ctx.workshop;
  const hasPix = Boolean(ws.pixKey && ws.pixMerchantName && ws.pixCity);

  const toItem = (i: (typeof board.confirmed)[number]) => {
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
  };
  const awaitingItems = board.awaiting.map(toItem);
  const items = board.confirmed.map(toItem);
  const nothing = items.length === 0 && awaitingItems.length === 0;

  return (
    <div className="space-y-5">
      <PageHeader
        tone="ink"
        illustration="/illustrations/cobre.svg"
        kicker={t("cobros.title")}
        title={<Money cents={board.totalOpenCents} locale={locale} className="text-4xl sm:text-5xl" />}
        subtitle={
          board.totalAwaitingCents > 0
            ? `${t("hoy.owedSub", { count: board.confirmed.length })} · ${t("hoy.awaitingPlus", { amount: formatBRL(board.totalAwaitingCents, locale) })}`
            : t("hoy.owedSub", { count: board.confirmed.length })
        }
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
      {!hasPix && !nothing && ctx.access.canWrite ? (
        <details className="group rounded-3xl border border-ink/[0.06] bg-card p-5 shadow-soft">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-mint-100 text-accent-foreground">
              <QrCode aria-hidden="true" className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{t("cobros.pixInlineTitle")}</span>
              <span className="block text-sm text-muted-foreground">{t("cobros.pixMissing")}</span>
            </span>
            <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <PixForm pix={{ type: ws.pixKeyType ?? "evp", key: ws.pixKey ?? "", name: ws.pixMerchantName ?? ws.name.slice(0, 25), city: ws.pixCity ?? "Sao Paulo" }} />
        </details>
      ) : null}

      {nothing ? (
        <EmptyState illustration={<NeedleIllustration />} title={t("cobros.empty")} />
      ) : (
        <>
          {awaitingItems.length ? (
            <section aria-labelledby="sec-awaiting" className="space-y-3">
              <div>
                <h2 id="sec-awaiting" className="font-medium">
                  {t("cobros.sectionAwaiting")} · {formatBRL(board.totalAwaitingCents, locale)}
                </h2>
                <p className="text-sm text-muted-foreground">{t("cobros.sectionAwaitingLead")}</p>
              </div>
              <ReceivableList mode="awaiting" items={awaitingItems} workshopName={ws.name} canWrite={ctx.access.canWrite} canMarkPaid={ctx.access.canMarkPaid} />
            </section>
          ) : null}
          <section aria-labelledby="sec-confirmed" className="space-y-3">
            <div>
              <h2 id="sec-confirmed" className="font-medium">
                {t("cobros.sectionConfirmed")} · {formatBRL(board.totalOpenCents, locale)}
              </h2>
              <p className="text-sm text-muted-foreground">{t("cobros.sectionConfirmedLead")}</p>
            </div>
            {items.length ? (
              <ReceivableList items={items} workshopName={ws.name} canWrite={ctx.access.canWrite} canMarkPaid={ctx.access.canMarkPaid} />
            ) : (
              <p className="rounded-2xl border border-dashed border-ink/15 px-5 py-6 text-center text-muted-foreground">{t("cobros.confirmedEmpty")}</p>
            )}
          </section>
        </>
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
