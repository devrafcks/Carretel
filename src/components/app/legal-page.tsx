import { getTranslations } from "next-intl/server";
import { ArrowRight, Check, Info } from "@/components/icons";
import { Link } from "@/i18n/navigation";
import { legal, legalValue, abuseChannel } from "@/config/legal";
import type { LegalDoc } from "@/content/legal";

const slug = (i: number) => `secao-${i + 1}`;

/** Página de documento legal: resumo no topo, índice fixo ao lado (computador), seções numeradas e contato no fim. */
export async function LegalPage({ doc, version, related }: { doc: LegalDoc; version?: string; related?: { href: string; label: string } }) {
  const t = await getTranslations("legal");
  const contact = [
    [t("company"), legal.companyName],
    [t("cnpj"), legal.cnpj],
    [t("address"), legal.address],
    [t("email"), legal.supportEmail],
    [t("dpo"), [legal.dpoName, legal.dpoEmail].filter(Boolean).join(" · ")],
    [t("forum"), legal.forumCity],
    [t("abuse"), abuseChannel()],
  ] as const;

  return (
    <article className="container-wide pb-24 pt-12 sm:pt-16">
      {/* cabeçalho */}
      <header className="max-w-3xl">
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-2 rounded-full bg-vivid" aria-hidden="true" />
          Carretel
          {version ? <span className="font-mono text-xs">· {t("version", { version })}</span> : null}
        </p>
        <h1 className="text-hero mt-4 text-5xl text-balance sm:text-6xl">{doc.title}</h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">{doc.lead}</p>
        {version ? (
          <p className="mt-5 inline-flex items-start gap-2 rounded-full border border-ink/10 bg-card px-4 py-2 text-sm text-muted-foreground">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>
              <span className="font-medium text-foreground">{t("draftShort")}.</span> {t("pendingSources")}
            </span>
          </p>
        ) : null}
      </header>

      {/* resumo */}
      {doc.summary?.length ? (
        <section aria-labelledby="resumo" className="mt-10 rounded-[2rem] bg-mint-soft p-6 sm:p-8">
          <h2 id="resumo" className="text-sm font-medium uppercase tracking-wide text-accent-foreground">
            {t("summaryTitle")}
          </h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {doc.summary.map((s) => (
              <li key={s} className="flex items-start gap-3 rounded-2xl bg-card/80 p-4 shadow-soft">
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check aria-hidden="true" className="size-4" stroke={2.2} />
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-12 grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-16">
        {/* índice */}
        {doc.sections.length > 2 ? (
          <nav aria-label={t("toc")} className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-sm font-medium text-muted-foreground">{t("toc")}</p>
            <ol className="mt-3 space-y-1 border-l border-ink/10">
              {doc.sections.map((s, i) => (
                <li key={s.h}>
                  <a href={`#${slug(i)}`} className="-ml-px flex min-h-9 items-center gap-3 border-l border-transparent py-1 pl-4 text-[0.9375rem] text-muted-foreground transition-colors hover:border-ink hover:text-foreground">
                    <span className="font-mono text-xs tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    {s.h}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        ) : (
          <span aria-hidden="true" className="hidden lg:block" />
        )}

        {/* seções */}
        <div className="max-w-3xl">
          <div className="divide-y divide-ink/[0.07]">
            {doc.sections.map((s, i) => (
              <section key={s.h} id={slug(i)} className="scroll-mt-24 py-8 first:pt-0">
                <h2 className="flex items-baseline gap-4 text-2xl font-medium">
                  <span className="font-mono text-sm text-muted-foreground tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  {s.h}
                </h2>
                <div className="mt-4 space-y-3 pl-0 text-[1.0625rem] leading-relaxed text-foreground/85 sm:pl-10">
                  {s.p.map((p, k) => (
                    <p key={k}>{p}</p>
                  ))}
                  {s.list?.length ? (
                    <ul className="space-y-2.5">
                      {s.list.map((li) => (
                        <li key={li} className="flex gap-3">
                          <span className="mt-[0.6rem] size-1.5 shrink-0 rounded-full bg-vivid" aria-hidden="true" />
                          <span>{li}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </section>
            ))}
          </div>

          {/* contato */}
          <section aria-labelledby="contato" className="mt-6 rounded-3xl border border-ink/[0.06] bg-card p-6 shadow-soft sm:p-8">
            <h2 id="contato" className="text-xl font-medium">
              {t("contactTitle")}
            </h2>
            <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {contact.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-sm text-muted-foreground">{k}</dt>
                  <dd className="mt-0.5 font-medium">{legalValue(v)}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-sm text-muted-foreground">{t("sla", { days: legal.supportSlaDays })}</p>
          </section>

          {related ? (
            <Link href={related.href} className="group mt-6 flex min-h-16 items-center justify-between gap-4 rounded-3xl border border-ink/10 px-6 py-4 transition-colors hover:border-ink/30">
              <span>
                <span className="block text-sm text-muted-foreground">{t("readAlso")}</span>
                <span className="block text-lg font-medium">{related.label}</span>
              </span>
              <ArrowRight aria-hidden="true" className="size-5 transition-transform group-hover:translate-x-1" />
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
