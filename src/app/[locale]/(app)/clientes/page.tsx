import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireWorkshop } from "@/lib/session";
import { listClients, clientStats } from "@/server/queries";
import { PageHeader } from "@/components/app/page-header";
import { ClientsManager } from "./clients-client";

export default async function ClientesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ctx = await requireWorkshop();
  const t = await getTranslations();
  const [clients, stats] = await Promise.all([listClients(ctx.tdb), clientStats(ctx.tdb)]);
  return (
    <div>
      <PageHeader title={t("clients.title")} subtitle={t("more.clientsDesc")} />
      <ClientsManager
        canWrite={ctx.access.canWrite}
        clients={clients
          .map((c) => {
            const s = stats.get(c.id);
            return {
              id: c.id,
              name: c.name,
              phone: c.phoneE164 ?? "",
              locale: c.preferredLocale,
              notes: c.notes ?? "",
              owedCents: s?.owedCents ?? 0,
              batches: s?.batches ?? 0,
              openBatches: s?.openBatches ?? 0,
              volumeCents: s?.volumeCents ?? 0,
            };
          })
          .sort((a, b) => b.owedCents - a.owedCents || a.name.localeCompare(b.name))}
      />
    </div>
  );
}
