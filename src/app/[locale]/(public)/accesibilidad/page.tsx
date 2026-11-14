import { getTranslations, setRequestLocale } from "next-intl/server";
import { Accessibility, Contrast, Eye, HandFinger, Keyboard, Mic, Search, Volume2, Heart, type AppIcon } from "@/components/icons";
import { legal } from "@/config/legal";

const KEYS = ["altA", "altT", "altE", "altB", "altU", "altV", "altJ", "altG", "altF", "altC", "altI", "altD", "altH", "altM", "altK", "altP", "altR", "alt15"] as const;
const KBD: Record<(typeof KEYS)[number], string> = {
  altA: "Alt + A",
  altT: "Alt + T",
  altE: "Alt + E",
  altB: "Alt + B",
  altU: "Alt + U",
  altV: "Alt + V",
  altJ: "Alt + J",
  altG: "Alt + G",
  altF: "Alt + F",
  altC: "Alt + C",
  altI: "Alt + I",
  altD: "Alt + D",
  altH: "Alt + H",
  altM: "Alt + M",
  altK: "Alt + K",
  altP: "Alt + P",
  altR: "Alt + R",
  alt15: "Alt + 1…5",
};
const FEATURE_ICONS: AppIcon[] = [Volume2, Keyboard, Search, HandFinger, Contrast, Mic];

export default async function AccesibilidadPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("a11y");
  const features = t.raw("f") as [string, string][];

  return (
    <div className="pb-24">
      <section className="container-wide pt-14 sm:pt-20">
        <p className="inline-flex items-center gap-2 rounded-full border border-mint-200 bg-mint-50 px-4 py-1.5 text-sm text-accent-foreground">
          <Accessibility aria-hidden="true" className="size-4" />
          WCAG 2.2 AA · eMAG
        </p>
        <h1 className="text-hero mt-5 max-w-4xl text-5xl text-balance sm:text-7xl">{t("title")}</h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">{t("lead")}</p>
      </section>

      {/* o que já vem no app */}
      <section className="container-wide mt-14 sm:mt-20">
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-2 rounded-full bg-vivid" aria-hidden="true" />
          {t("builtInKicker")}
        </p>
        <h2 className="text-hero mt-3 text-4xl sm:text-5xl">{t("builtInTitle")}</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(([title, body], i) => {
            const Icon = FEATURE_ICONS[i] ?? Eye;
            return (
              <li key={title} className="rounded-3xl border border-ink/[0.06] bg-card p-6 shadow-soft">
                <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-mint-100 text-vivid-strong">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-medium">{title}</h3>
                <p className="mt-1.5 text-muted-foreground">{body}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* painel extra + atalhos */}
      <section className="container-wide mt-16 sm:mt-24">
        <div className="rounded-[2.5rem] bg-mint-soft p-6 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.4fr]">
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-accent-foreground">{t("panelKicker")}</p>
              <h2 className="text-hero mt-3 text-3xl sm:text-4xl">{t("panelTitle")}</h2>
              <p className="mt-3 text-muted-foreground">{t("panelBody")}</p>
              <div className="mt-6 rounded-3xl bg-card/80 p-5">
                <p className="inline-flex items-center gap-2 font-medium">
                  <Volume2 aria-hidden="true" className="size-5 text-vivid-strong" />
                  {t("voiceTitle")}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">{t("voiceBody")}</p>
              </div>
            </div>
            <div className="rounded-3xl bg-card p-5 shadow-soft sm:p-6">
              <h3 className="text-lg font-medium">{t("shortcutsTitle")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t("shortcutsHint")}</p>
              <dl className="mt-4 grid gap-x-6 sm:grid-cols-2">
                {KEYS.map((k) => (
                  <div key={k} className="flex items-start gap-3 border-b border-ink/[0.05] py-2.5">
                    <dt className="shrink-0">
                      <kbd className="inline-flex min-w-[5.5rem] justify-center rounded-lg border border-ink/10 bg-mint-50 px-2 py-0.5 font-mono text-xs">{KBD[k]}</kbd>
                    </dt>
                    <dd className="text-sm">{t(`shortcuts.${k}`)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* compromisso */}
      <section className="container-wide mt-16 sm:mt-24">
        <div className="flex flex-col gap-4 rounded-3xl border border-ink/[0.06] bg-card p-6 shadow-soft sm:flex-row sm:items-start sm:p-8">
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Heart aria-hidden="true" className="size-6" />
          </span>
          <div>
            <h2 className="text-xl font-medium">{t("commitmentTitle")}</h2>
            <p className="mt-2 max-w-3xl text-muted-foreground">{t("commitmentBody")}</p>
            {legal.supportEmail ? <p className="mt-3 font-medium">{t("contact", { email: legal.supportEmail })}</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
