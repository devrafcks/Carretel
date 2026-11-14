"use client";
import * as React from "react";
import { useLocale, useTranslations } from "next-intl";
import { Mic, MicOff } from "lucide-react";
import { useSpeech, useSpeechSupported } from "@/lib/speech/use-speech";
import { useOffline } from "./offline-provider";
import { cn } from "@/lib/utils";

/**
 * Botão de microfone (56px, aria-pressed, status falado). O resultado vai para o campo, sempre editável.
 * `parse` converte as alternativas reconhecidas no valor do campo; null = "No entendimos".
 */
export function VoiceButton({
  fieldLabel,
  parse,
  onValue,
  onError,
}: {
  fieldLabel: string;
  parse: (text: string) => string | null;
  onValue: (v: string) => void;
  onError: (msg: string) => void;
}) {
  const t = useTranslations("batch");
  const locale = useLocale();
  const supported = useSpeechSupported();
  const { online } = useOffline();
  const { listening, listen, stop } = useSpeech(locale);

  if (!supported || !online) return null;

  return (
    <>
      <button
        type="button"
        aria-pressed={listening}
        aria-label={t("mic", { field: fieldLabel })}
        onClick={() => {
          if (listening) return stop();
          listen(
            (alts) => {
              for (const a of alts) {
                const v = parse(a);
                if (v !== null) return onValue(v);
              }
              onError(t("micNotUnderstood"));
            },
            (code) => onError(code === "unsupported" ? t("micUnsupported") : t("micNotUnderstood")),
          );
        }}
        className={cn(
          "inline-flex size-14 shrink-0 items-center justify-center rounded-lg border-[1.5px]",
          listening ? "border-overdue-calote-border bg-overdue-calote-solid text-overdue-calote-solid-fg" : "border-input bg-card text-primary hover:bg-muted",
        )}
      >
        {listening ? <MicOff aria-hidden="true" className="size-6" /> : <Mic aria-hidden="true" className="size-6" />}
      </button>
      <span className="sr-only" aria-live="assertive">
        {listening ? t("micListening") : ""}
      </span>
    </>
  );
}
