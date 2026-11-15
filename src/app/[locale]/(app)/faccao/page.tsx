import { getTranslations, setRequestLocale } from "next-intl/server";
import { desc, inArray } from "drizzle-orm";
import { requireWorkshop } from "@/lib/session";
import { batches, clients, outsourceReturns, outsourceShipments } from "@/db/schema";
import { PageHeader } from "@/components/app/page-header";
import { summarizeShipment, isOverdue } from "@/lib/outsource";
import { todayISO } from "@/lib/dates";
import { OutsourceBoard, type ShipmentView } from "./outsource-client";

/** Facção: peças enviadas para facção/costureira externa e o que voltou (bom, com defeito, faltante). */
export default async function FaccaoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ctx = await requireWorkshop();
  const t = await getTranslations("outsource");
  const [shipments, returns, openBatches, clientRows] = await Promise.all([
    ctx.tdb.select(outsourceShipments, undefined, { orderBy: [desc(outsourceShipments.sentOn), desc(outsourceShipments.createdAt)], limit: 200 }),
    ctx.tdb.select(outsourceReturns),
    ctx.tdb.select(batches, inArray(batches.status, ["received", "in_production", "ready"]), { orderBy: desc(batches.createdAt), limit: 100 }),
    ctx.tdb.select(clients),
  ]);
  const clientName = new Map(clientRows.map((c) => [c.id, c.name]));
  const today = todayISO();

  const views: ShipmentView[] = shipments.map((s) => {
    const rets = returns.filter((r) => r.shipmentId === s.id).sort((a, b) => a.returnedOn.localeCompare(b.returnedOn));
    const sum = summarizeShipment(s.quantity, rets);
    return {
      id: s.id,
      partnerName: s.partnerName,
      partnerPhone: s.partnerPhoneE164,
      reference: s.reference,
      quantity: s.quantity,
      sentOn: s.sentOn,
      dueOn: s.dueOn,
      status: s.status,
      note: s.note,
      overdue: isOverdue(s.dueOn, sum.pending, today),
      summary: sum,
      returns: rets.map((r) => ({ id: r.id, returnedOn: r.returnedOn, good: r.goodQty, defect: r.defectQty, missing: r.missingQty, note: r.note })),
    };
  });

  const active = views.filter((v) => v.status !== "returned");
  const piecesOut = active.reduce((a, v) => a + v.summary.pending, 0);

  return (
    <div>
      <PageHeader tone="indigo" illustration="/illustrations/acerto.svg" title={t("title")} subtitle={t("subtitle", { count: active.length, pieces: piecesOut })} backHref="/mas" backLabel={t("back")} />
      <OutsourceBoard
        locale={locale}
        canWrite={ctx.access.canWrite}
        shipments={views}
        batches={openBatches.map((b) => ({
          id: b.id,
          label: `${b.clientId ? (clientName.get(b.clientId) ?? "") : ""}${b.reference ? ` · ${b.reference}` : ""} · ${b.quantity}`.replace(/^ · /, ""),
          reference: b.reference,
          quantity: b.quantity,
        }))}
      />
    </div>
  );
}
