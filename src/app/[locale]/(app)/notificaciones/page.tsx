import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/app/page-header";
import { NotificationList } from "@/components/app/notifications";

export default async function NotificacionesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("notifications");
  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("lead")} />
      <NotificationList />
    </div>
  );
}
