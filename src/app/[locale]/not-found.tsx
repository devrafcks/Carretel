import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { NeedleIllustration } from "@/components/brand/illustrations";

export default async function NotFound() {
  const t = await getTranslations("common");
  return (
    <main id="conteudo" className="mx-auto max-w-lg px-4 py-16">
      <EmptyState
        illustration={<NeedleIllustration />}
        title={t("errorNotFound")}
        action={
          <Link href="/" className={buttonVariants({ size: "lg", block: true })}>
            {t("back")}
          </Link>
        }
      />
    </main>
  );
}
