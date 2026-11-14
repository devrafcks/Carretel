import { getTranslations } from "next-intl/server";
import { TriangleAlert } from "lucide-react";
import { Card, Notice } from "@/components/ui/card";
import { legal, legalValue, abuseChannel } from "@/config/legal";

export async function LegalPage({ doc, version }: { doc: { title: string; sections: { h: string; p: string[] }[] }; version?: string }) {
  const t = await getTranslations("legal");
  return (
    <article className="mx-auto max-w-[40rem] px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold">{doc.title}</h1>
      {version ? <p className="mt-1 font-mono text-sm text-muted-foreground">{t("version", { version })}</p> : null}
      <Notice tone="warning" className="mt-4" icon={<TriangleAlert />}>
        <p className="font-semibold">{t("draftBanner")}</p>
        <p className="mt-1">{t("pendingSources")}</p>
      </Notice>
      <div className="mt-6 space-y-6">
        {doc.sections.map((s) => (
          <section key={s.h}>
            <h2 className="font-display text-xl font-bold">{s.h}</h2>
            {s.p.map((p, i) => (
              <p key={i} className="mt-2">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
      <Card className="mt-8 p-5">
        <dl className="space-y-1.5">
          {(
            [
              [t("company"), legal.companyName],
              [t("cnpj"), legal.cnpj],
              [t("address"), legal.address],
              [t("email"), legal.supportEmail],
              [t("dpo"), [legal.dpoName, legal.dpoEmail].filter(Boolean).join(" · ")],
              [t("forum"), legal.forumCity],
              [t("abuse"), abuseChannel()],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="flex flex-wrap gap-x-2">
              <dt className="font-semibold">{k}:</dt>
              <dd>{legalValue(v)}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-muted-foreground">{t("sla", { days: legal.supportSlaDays })}</p>
      </Card>
    </article>
  );
}
