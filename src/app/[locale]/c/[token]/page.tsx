import type { Metadata } from "next";
import { sortSizes } from "@/lib/utils";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CircleCheck, TriangleAlert, Link2Off } from "@/components/icons";
import { findProofByToken, markProofViewed, hitRateLimit, notifyWorkshop, proofNotice } from "@/db/public";
import { audit, requestMeta } from "@/lib/audit";
import { loadWorkshopContext } from "@/lib/session";
import { buildPixBrCode } from "@/lib/pix-brcode";
import { formatDate, formatDateTime } from "@/lib/dates";
import { formatBRL } from "@/lib/money";
import { verificationCode } from "@/lib/crypto";
import { BrandMark } from "@/components/brand/mark";
import { PageHeader } from "@/components/app/page-header";
import { Card, Notice } from "@/components/ui/card";
import { brand } from "@/config/brand";
import { ProofActions, PixBox } from "./proof-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function ProofPage({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const meta = await requestMeta();
  const limited = await hitRateLimit(`proofview:${meta.ip ?? "-"}`, 120, 600);
  const r = limited ? null : await findProofByToken(token);
  const other = locale === "es" ? "pt-BR" : "es";

  const shell = { title: t("proof.titleFor"), other, token };

  if (limited) {
    return (
      <ProofShell {...shell}>
        <Notice tone="danger" role="alert">
          <p className="font-semibold">{t("proof.rateLimited")}</p>
        </Notice>
      </ProofShell>
    );
  }
  if (!r || r.proof.revokedAt) {
    return (
      <ProofShell {...shell}>
        <Card className="p-6 text-center">
          <Link2Off aria-hidden="true" className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-3 text-lg font-semibold">{t("proof.invalid")}</p>
        </Card>
      </ProofShell>
    );
  }

  const { proof, workshop, receivable } = r;
  // o próprio taller abrindo o link para conferir não conta como "o cliente abriu"
  const isOwner = (await loadWorkshopContext())?.workshop.id === workshop.id;
  if (!proof.viewedAt && !isOwner) {
    await markProofViewed(proof.id, meta.ip);
    const nv = proofNotice(r);
    await notifyWorkshop(workshop.id, { kind: "proof_viewed", dedupeKey: `viewed:${proof.id}`, params: nv.params, href: nv.href });
  }
  await audit("public_proof.view", { workshopId: workshop.id, actor: "public", resource: proof.id });

  const s = proof.snapshot;
  const code = verificationCode(proof.contentSha256);
  const conf = proof.confirmedAt ? formatDateTime(proof.confirmedAt, locale) : null;
  const openCents = receivable ? receivable.amountCents - receivable.paidCents : 0;
  let pix: string | null = null;
  if (workshop.pixKey && workshop.pixMerchantName && workshop.pixCity && openCents > 0) {
    try {
      pix = buildPixBrCode({ key: workshop.pixKey, merchantName: workshop.pixMerchantName, merchantCity: workshop.pixCity, amountCents: openCents, txid: "CRT" + (receivable?.id ?? proof.id).replace(/-/g, "").slice(0, 20) });
    } catch {
      pix = null;
    }
  }

  return (
    <ProofShell {...shell}>
      <PageHeader
        tone="indigo"
        illustration="/illustrations/comprove.svg"
        kicker={s.workshop.name}
        title={t("proof.titleFor")}
        subtitle={<span className="tabular-money">{t("common.pieces", { count: s.delivery.quantity })} · {formatBRL(s.delivery.amountCents, locale)}</span>}
      />
      <Card className="anim-rise delay-1 ficha-corner rounded-3xl p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-muted-foreground">{t("proof.from")}</p>
            <h1 className="font-display text-2xl font-bold">{s.workshop.name}</h1>
            {s.workshop.city ? <p className="text-muted-foreground">{s.workshop.city}</p> : null}
          </div>
          <span className="shrink-0 rounded-md border-2 border-foreground px-2 py-1 text-center font-display text-xs font-bold uppercase leading-tight tracking-wide">
              {t("proof.nonFiscal")}
            </span>
        </div>
        <hr className="stitch-rule my-4" />
        <dl className="space-y-2.5">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{t("proof.to")}</dt>
            <dd className="text-right font-semibold">{s.client.name}</dd>
          </div>
          {s.batch.reference ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t("proof.reference")}</dt>
              <dd className="font-mono font-medium">{s.batch.reference}</dd>
            </div>
          ) : null}
          {s.batch.color ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t("proof.color")}</dt>
              <dd className="font-semibold">{s.batch.color}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{t("proof.deliveredAt")}</dt>
            <dd className="font-semibold tabular-money">
              {formatDate(s.delivery.deliveredAt, locale, { year: "numeric" })} {formatDateTime(new Date(s.delivery.deliveredAt), locale).time}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{t("proof.quantity")}</dt>
            <dd className="tabular-money text-xl font-bold">{s.delivery.quantity}</dd>
          </div>
          {s.delivery.sizeGrid ? (
            <div>
              <dt className="text-muted-foreground">{t("proof.grid")}</dt>
              <dd className="mt-1 flex flex-wrap gap-2">
                {sortSizes(s.delivery.sizeGrid).map(([k, v]) => (
                  <span key={k} className="rounded-md border border-border bg-secondary px-2.5 py-1 font-semibold">
                    {k} <span className="tabular-money">{v}</span>
                  </span>
                ))}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{t("proof.unitPrice")}</dt>
            <dd className="tabular-money font-semibold">{formatBRL(s.batch.unitPriceCents, locale)}</dd>
          </div>
          {s.delivery.discountCents > 0 ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t("proof.discount")}</dt>
              <dd className="tabular-money font-semibold">− {formatBRL(s.delivery.discountCents, locale)}</dd>
            </div>
          ) : null}
          <div className="flex items-baseline justify-between gap-3 border-t border-border pt-2.5">
            <dt className="font-semibold">{t("proof.amount")}</dt>
            <dd className="tabular-money text-2xl font-bold">{formatBRL(s.delivery.amountCents, locale)}</dd>
          </div>
          {s.delivery.note ? (
            <div>
              <dt className="text-muted-foreground">{t("proof.note")}</dt>
              <dd>{s.delivery.note}</dd>
            </div>
          ) : null}
        </dl>
        {s.photoIds.length ? (
          <div className="mt-4">
            <p className="text-muted-foreground">{t("proof.photos")}</p>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {s.photoIds.map((id) => (
                <a key={id} href={`/api/public-media/${token}/${id}`} target="_blank" rel="noreferrer noopener">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/public-media/${token}/${id}`} alt={t("proof.photos")} referrerPolicy="no-referrer" className="aspect-square w-full rounded-lg border border-border object-cover" />
                </a>
              ))}
            </div>
          </div>
        ) : null}
        <p className="mt-4 font-mono text-sm text-muted-foreground">
          {t("common.verificationCode")}: <span className="font-semibold text-foreground">{code}</span> · v{s.delivery.version}
        </p>
      </Card>

      {conf ? (
        <Notice tone="success" icon={<CircleCheck />} role="status">
          <p className="font-semibold">{t("proof.alreadyConfirmed", { name: proof.confirmedName ?? "", ...conf })}</p>
        </Notice>
      ) : proof.disputedAt ? (
        <Notice tone="warning" icon={<TriangleAlert />} role="status">
          <p className="font-semibold">{t("proof.alreadyDisputed", { date: formatDate(proof.disputedAt, locale), quantity: proof.disputedQuantity ?? 0 })}</p>
        </Notice>
      ) : (
        <ProofActions token={token} deliveredQuantity={s.delivery.quantity} />
      )}

      <PixBox token={token} pix={pix} amountLabel={formatBRL(openCents, locale)} paid={receivable?.status === "paid"} />

      <p className="text-muted-foreground">{t("proof.legalNote")}</p>
      {brand.showMadeWithFooter ? (
        <p className="pt-2 text-center text-muted-foreground">
          <a href={`/${locale}`} className="inline-flex min-h-12 items-center gap-2 underline-offset-4 hover:underline">
            <BrandMark className="size-5 text-primary" /> {t("common.madeWith")}
          </a>
        </p>
      ) : null}
    </ProofShell>
  );
}

function ProofShell({ children, title, other, token }: { children: React.ReactNode; title: string; other: string; token: string }) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-3">
          <span className="inline-flex items-center gap-2 text-primary">
            <BrandMark />
            <span className="font-display text-lg font-extrabold text-foreground">Carretel</span>
            <span className="sr-only">{title}</span>
          </span>
          <a href={`/${other}/c/${token}`} lang={other} className="inline-flex min-h-12 items-center rounded-full border border-ink/15 bg-card px-4 font-bold shadow-soft">
            {other === "es" ? "Español" : "Português"}
          </a>
        </div>
      </header>
      <main id="conteudo" className="mx-auto max-w-xl space-y-4 px-4 py-5">
        {children}
      </main>
    </div>
  );
}
