"use client";
import * as React from "react";
import { useTranslations } from "next-intl";
import { Smartphone } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type BIPEvent = Event & { prompt: () => Promise<void> };

/** Instrução bilíngue de instalação (iOS não tem beforeinstallprompt: Compartilhar → Adicionar à Tela de Início). */
export function InstallHint() {
  const t = useTranslations("landing");
  const [evt, setEvt] = React.useState<BIPEvent | null>(null);
  React.useEffect(() => {
    const h = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
    };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);
  return (
    <Card className="p-5">
      <Smartphone aria-hidden="true" className="size-7 text-primary" />
      <h2 className="mt-2 font-display text-xl font-bold">{t("installTitle")}</h2>
      <ul className="mt-2 space-y-1.5">
        <li>{t("installAndroid")}</li>
        <li>{t("installIos")}</li>
      </ul>
      {evt ? (
        <Button className="mt-3" onClick={() => void evt.prompt()}>
          {t("installButton")}
        </Button>
      ) : null}
    </Card>
  );
}
