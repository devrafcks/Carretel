"use client";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MachineIllustration } from "@/components/brand/illustrations";

/** Estado "erro": canônico da tela Hoy — o que está no celular está seguro. */
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations();
  return (
    <div role="alert" className="pt-4">
      <EmptyState
        illustration={<MachineIllustration />}
        title={t("hoy.loadError")}
        action={
          <Button size="lg" block onClick={() => reset()}>
            {t("common.retry")}
          </Button>
        }
      />
    </div>
  );
}
