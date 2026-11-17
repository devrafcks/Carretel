"use client";
/**
 * Aviso de erro de uma ação. Erro de regra (ex.: "lote fechado") é só o texto.
 * Erro inesperado vem com código (ref): o aviso mostra o código, fica mais tempo na tela e tem "Pedir ajuda",
 * que abre o e-mail de suporte já com código, página, hora e aparelho.
 */
import { toast } from "sonner";
import { deviceSummary, supportLocale, supportMailto } from "@/lib/error-report";

const LABEL = {
  "pt-BR": { code: "Código do erro:", help: "Pedir ajuda" },
  es: { code: "Código del error:", help: "Pedir ayuda" },
} as const;

export function errorToast(message: string, ref?: string | null) {
  if (!ref) return toast.error(message);
  const locale = supportLocale(typeof document !== "undefined" ? document.documentElement.lang : null);
  const l = LABEL[locale];
  return toast.error(message, {
    description: `${l.code} ${ref}`,
    duration: 15_000,
    action: {
      label: l.help,
      onClick: () => {
        window.location.href = supportMailto({ ref, locale, page: window.location.pathname, device: deviceSummary(navigator.userAgent) });
      },
    },
  });
}

/** Para erro mostrado dentro da tela (não em aviso): junta o código ao texto, ex.: "Algo deu errado. (código K7M2QX)". */
export function withRef(message: string, ref?: string | null): string {
  return ref ? `${message} (código ${ref})` : message;
}
