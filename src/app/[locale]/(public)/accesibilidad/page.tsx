import { getTranslations, setRequestLocale } from "next-intl/server";
import { Card, Notice } from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import { Accessibility, Info } from "lucide-react";
import { legal, legalValue } from "@/config/legal";

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

export default async function AccesibilidadPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("a11y");
  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-10 sm:px-6">
      <PageHeader tone="leaf" illustration="/illustrations/hero.svg" kicker={<span className="inline-flex items-center gap-1.5"><Accessibility aria-hidden="true" className="size-4" /> WCAG 2.2 AA</span>} title={t("title")} subtitle={t("lead")} />
      <Notice tone="info" icon={<Info />}>
        <h2 className="font-display text-lg font-bold">{t("panelTitle")}</h2>
        <p className="mt-1">{t("panelBody")}</p>
        <p className="mt-1 font-semibold" title={t("tooltip")}>
          {t("tooltip")}
        </p>
      </Notice>
      <Card className="p-5">
        <h2 className="font-display text-xl font-bold">{t("shortcutsTitle")}</h2>
        <table className="mt-3 w-full text-left">
          <tbody className="divide-y divide-border">
            {KEYS.map((k) => (
              <tr key={k}>
                <th scope="row" className="w-36 py-2 pr-3 align-top">
                  <kbd className="rounded-md border border-border bg-secondary px-2 py-0.5 font-mono text-sm">{KBD[k]}</kbd>
                </th>
                <td className="py-2">{t(`shortcuts.${k}`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card className="p-5">
        <h2 className="font-display text-xl font-bold">{t("voiceTitle")}</h2>
        <p className="mt-1">{t("voiceBody")}</p>
      </Card>
      <Card className="p-5">
        <h2 className="font-display text-xl font-bold">{t("commitmentTitle")}</h2>
        <p className="mt-1">{t("commitmentBody")}</p>
        <p className="mt-2 font-semibold">{t("contact", { email: legalValue(legal.supportEmail) })}</p>
      </Card>
    </div>
  );
}
