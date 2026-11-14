import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CircleCheck, Clock } from "@/components/icons";
import { findSettlementByToken, hitRateLimit } from "@/db/public";
import { requestMeta, audit } from "@/lib/audit";
import { formatDate } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { BrandMark } from "@/components/brand/mark";
import { PageHeader } from "@/components/app/page-header";
import { Card, Notice } from "@/components/ui/card";
import { getDbItems } from "./items";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" };

/** Recibo do costureiro: só leitura, só os dados da própria pessoa. */
export default async function ReceiptPage({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const meta = await requestMeta();
  const limited = await hitRateLimit(`receipt:${meta.ip ?? "-"}`, 120, 600);
  const r = limited ? null : await findSettlementByToken(token);
  const other = locale === "es" ? "pt-BR" : "es";

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-3">
          <span className="inline-flex items-center gap-2 text-primary">
            <BrandMark />
            <span className="font-display text-lg font-semibold text-foreground">{t("receipt.title")}</span>
          </span>
          <a href={`/${other}/r/${token}`} lang={other} className="inline-flex min-h-12 items-center rounded-full border border-ink/15 bg-card px-4 font-bold shadow-soft">
            {other === "es" ? "Español" : "Português"}
          </a>
        </div>
      </header>
      <main id="conteudo" className="mx-auto max-w-xl space-y-4 px-4 py-5">
        {!r ? (
          <Card className="p-6 text-center">
            <p className="text-lg font-semibold">{t("receipt.invalid")}</p>
          </Card>
        ) : (
          <ReceiptBody r={r} locale={locale} t={t} />
        )}
      </main>
    </div>
  );

  async function ReceiptBody({ r, locale, t }: { r: NonNullable<Awaited<ReturnType<typeof findSettlementByToken>>>; locale: string; t: Awaited<ReturnType<typeof getTranslations>> }) {
    const s = r.settlement;
    await audit("public_receipt.view", { workshopId: s.workshopId, actor: "public", resource: s.id });
    const items = await getDbItems(s.workshopId, s.id);
    const f = (c: number) => formatBRL(c, locale);
    return (
      <>
        <PageHeader
          tone="terracota"
          illustration="/illustrations/acerto.svg"
          kicker={r.workshop.name}
          title={r.worker.name}
          subtitle={<span className="tabular-money">{t("receipt.net")}: {f(s.netCents)}</span>}
        />
        <Card className="anim-rise delay-1 ficha-corner rounded-3xl p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-muted-foreground">{r.workshop.name}</p>
              <h1 className="font-display text-2xl font-bold">{r.worker.name}</h1>
              <p className="text-muted-foreground tabular-money">
                {t("receipt.period")}: {formatDate(s.periodStart, locale)} – {formatDate(s.periodEnd, locale, { year: "numeric" })}
              </p>
            </div>
            <span className="shrink-0 rounded-md border-2 border-foreground px-2 py-1 text-center font-display text-xs font-bold uppercase leading-tight tracking-wide">
              <span lang="pt-BR" className="block">Recibo Não Fiscal</span>
              <span lang="es" className="block border-t border-foreground">Comprobante no fiscal</span>
            </span>
          </div>
          <hr className="stitch-rule my-4" />
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt>{t("receipt.production")}</dt>
              <dd className="tabular-money font-semibold">{f(s.grossCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{t("receipt.advances")}</dt>
              <dd className="tabular-money font-semibold">− {f(s.advancesCents)}</dd>
            </div>
            {s.adjustmentsCents !== 0 ? (
              <div className="flex justify-between">
                <dt>{t("receipt.adjustments")}</dt>
                <dd className="tabular-money font-semibold">{s.adjustmentsCents > 0 ? "− " : "+ "}{f(Math.abs(s.adjustmentsCents))}</dd>
              </div>
            ) : null}
            <div className="flex items-baseline justify-between border-t border-border pt-2">
              <dt className="font-semibold">{t("receipt.net")}</dt>
              <dd className="tabular-money text-2xl font-bold">{f(s.netCents)}</dd>
            </div>
          </dl>
          <div className="mt-4">
            {s.status === "paid" && s.paidAt ? (
              <Notice tone="success" icon={<CircleCheck />}>
                <p className="font-semibold">{t("receipt.paidAt", { date: formatDate(s.paidAt, locale, { year: "numeric" }) })}</p>
              </Notice>
            ) : (
              <Notice tone="awaiting" icon={<Clock />}>
                <p className="font-semibold">{t("receipt.pending")}</p>
              </Notice>
            )}
          </div>
        </Card>
        {items.length ? (
          <Card className="p-5">
            <h2 className="font-display text-lg font-bold">{t("receipt.items")}</h2>
            <ul className="mt-2 divide-y divide-border">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3 py-2">
                  <span className="min-w-0">
                    {i.kind === "advance" ? t("receipt.advances") : i.kind === "adjustment" ? t("receipt.adjustments") : i.description}
                    {i.pieces ? <span className="tabular-money text-muted-foreground"> · {t("common.pieces", { count: i.pieces })}</span> : null}
                  </span>
                  <span className="tabular-money shrink-0 font-semibold">{f(i.amountCents)}</span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
        <p className="text-muted-foreground">{t("receipt.privacy")}</p>
      </>
    );
  }
}
