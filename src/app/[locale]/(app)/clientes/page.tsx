import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireWorkshop } from "@/lib/session";
import { listClients } from "@/server/queries";
import { PageHeader } from "@/components/app/page-header";
import { ClientsManager } from "./clients-client";

export default async function ClientesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ctx = await requireWorkshop();
  const t = await getTranslations();
  const clients = await listClients(ctx.tdb);
  return (
    <div>
      <PageHeader tone="leaf" illustration="/illustrations/comprove.svg" title={t("clients.title")} backHref="/mas" backLabel={t("common.back")} />
      <ClientsManager canWrite={ctx.access.canWrite} clients={clients.map((c) => ({ id: c.id, name: c.name, phone: c.phoneE164 ?? "", locale: c.preferredLocale, notes: c.notes ?? "" }))} />
    </div>
  );
}
