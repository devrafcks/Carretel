"use client";
/**
 * Voz por campo (Web Speech API). Cadeia de idioma: es-BO → es-419 → es-US → es-ES (UI em ES); pt-BR.
 * Sem sinal ou sem suporte: o microfone some (o reconhecimento costuma depender da rede no Chrome Android).
 */
import * as React from "react";
import { speechLangChain } from "./numbers";

interface SR {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

function getCtor(): (new () => SR) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const noop = () => () => {};
export function useSpeechSupported(): boolean {
  return React.useSyncExternalStore(noop, () => Boolean(getCtor()), () => false);
}

export function useSpeech(locale: string) {
  const [listening, setListening] = React.useState(false);
  const recRef = React.useRef<SR | null>(null);

  const listen = React.useCallback(
    (onText: (alternatives: string[]) => void, onError: (code: string) => void) => {
      const Ctor = getCtor();
      if (!Ctor) return onError("unsupported");
      recRef.current?.abort();
      const chain = speechLangChain(locale);
      let idx = 0;
      const startWith = (lang: string) => {
        const rec = new Ctor();
        recRef.current = rec;
        rec.lang = lang;
        rec.interimResults = false;
        rec.maxAlternatives = 3;
        rec.continuous = false;
        rec.onresult = (e) => {
          const first = e.results[0];
          const alts: string[] = [];
          if (first) for (let i = 0; i < first.length; i++) alts.push(first[i]!.transcript);
          onText(alts);
        };
        rec.onerror = (e) => {
          if ((e.error === "language-not-supported" || e.error === "bad-grammar") && idx < chain.length - 1) {
            idx++;
            startWith(chain[idx]!);
            return;
          }
          setListening(false);
          onError(e.error);
        };
        rec.onend = () => setListening(false);
        setListening(true);
        try {
          rec.start();
        } catch {
          setListening(false);
          onError("start");
        }
      };
      startWith(chain[0]!);
    },
    [locale],
  );

  const stop = React.useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  React.useEffect(() => () => recRef.current?.abort(), []);
  return { listening, listen, stop };
}
