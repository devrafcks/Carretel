import { setRequestLocale } from "next-intl/server";
import { requireWorkshop } from "@/lib/session";
import { AppShell } from "@/components/app/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ctx = await requireWorkshop();
  return <AppShell ctx={ctx}>{children}</AppShell>;
}
