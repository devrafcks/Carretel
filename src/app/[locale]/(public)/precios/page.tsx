import { getTranslations, setRequestLocale } from "next-intl/server";
import { CircleCheck, QrCode, CreditCard } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default async function PreciosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pricing");
  const tl = await getTranslations("landing");
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <PageHeader tone="indigo" illustration="/illustrations/cobre.svg" title={t("title")} subtitle={t("free")} />
      <Card className="anim-rise delay-1 rounded-[2rem] border-2 border-primary p-8 shadow-lift">
        <p className="font-display">
          <span className="tabular-money text-5xl font-bold">{t("price")}</span>
          <span className="text-xl text-muted-foreground">{t("perMonth")}</span>
        </p>
        <p className="mt-3 text-lg">{t("includes")}</p>
        <p className="mt-3 flex gap-2 font-semibold">
          <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-paid-fg" />
          {t("free")}
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-4">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <QrCode aria-hidden="true" className="size-5 text-primary" />
              {t("pixTitle")}
            </h2>
            <p className="mt-1">{t("pixBody")}</p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <CreditCard aria-hidden="true" className="size-5 text-primary" />
              {t("cardTitle")}
            </h2>
            <p className="mt-1">{t("cardBody")}</p>
          </div>
        </div>
        <ul className="mt-5 space-y-2">
          <li className="flex gap-2">
            <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-paid-fg" />
            {t("noLockIn")}
          </li>
          <li className="flex gap-2">
            <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-paid-fg" />
            {t("readOnly")}
          </li>
        </ul>
        <Link href="/entrar?conta=nova" className={buttonVariants({ size: "lg", block: true, className: "mt-6" })}>
          {tl("ctaStart")}
        </Link>
      </Card>
    </div>
  );
}
