"use client";
/**
 * Tela de erro do Carretel. Usada pelas telas de erro do Next (error.tsx e global-error.tsx), então não depende
 * de nada que possa ter quebrado: textos próprios (es / pt-BR pela URL), sem next-intl.
 * Mostra o código do erro, tenta de novo, volta ao início e abre um e-mail de suporte já preenchido.
 */
import * as React from "react";
import { usePathname } from "next/navigation";
import { CircleCheck, Copy, Home, Mail, RefreshCw, TriangleAlert, WifiOff } from "@/components/icons";
import { SUPPORT_EMAIL, deviceSummary, refFromDigest, supportLocale, supportMailto, type SupportLocale } from "@/lib/error-report";
import { isChunkError, reportClientError } from "@/lib/client-error-reporter";
import { cn } from "@/lib/utils";

const T: Record<SupportLocale, Record<string, string>> = {
  "pt-BR": {
    title: "Algo deu errado nesta tela",
    text: "Seus dados estão seguros: o que você já salvou não se perde. O erro foi registrado e vamos olhar.",
    offlineTitle: "Você está sem internet",
    offlineText: "O que você registrou no celular fica guardado e é enviado quando a conexão voltar.",
    updating: "O Carretel acabou de ser atualizado. Recarregando…",
    retry: "Tentar de novo",
    home: "Voltar ao início",
    code: "Código do erro",
    copy: "Copiar",
    copied: "Copiado",
    helpTitle: "Continua dando erro?",
    helpText: "Escreva para nós. O e-mail já vai com o código e a página, é só contar o que você estava fazendo.",
    mail: "Pedir ajuda por e-mail",
    copyEmail: "Copiar e-mail",
  },
  es: {
    title: "Algo salió mal en esta pantalla",
    text: "Tus datos están seguros: lo que ya guardaste no se pierde. El error quedó registrado y lo vamos a revisar.",
    offlineTitle: "Estás sin internet",
    offlineText: "Lo que registraste en el celular queda guardado y se envía cuando vuelva la conexión.",
    updating: "Carretel se acaba de actualizar. Recargando…",
    retry: "Intentar de nuevo",
    home: "Volver al inicio",
    code: "Código del error",
    copy: "Copiar",
    copied: "Copiado",
    helpTitle: "¿Sigue fallando?",
    helpText: "Escríbenos. El correo ya va con el código y la página, solo cuenta qué estabas haciendo.",
    mail: "Pedir ayuda por correo",
    copyEmail: "Copiar correo",
  },
};

const RELOAD_KEY = "carretel.chunk-reload";

const noopSubscribe = () => () => {};
function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}
/** Recarrega sozinho só se não recarregou no último minuto (evita loop se o erro continuar). */
function shouldAutoReload(): boolean {
  try {
    return Date.now() - Number(sessionStorage.getItem(RELOAD_KEY) || 0) > 60_000;
  } catch {
    return false;
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ErrorScreen({ error, retry, home = "app", fullPage = false }: { error: unknown; retry?: () => void; home?: "app" | "site"; fullPage?: boolean }) {
  const pathname = usePathname() ?? "/";
  const locale = supportLocale(pathname);
  const t = T[locale];
  const digest = error && typeof error === "object" && "digest" in error ? String((error as { digest?: unknown }).digest ?? "") : null;
  // erro do servidor: o código é o digest (já registrado lá). Erro do navegador: código novo, registrado agora.
  const serverRef = refFromDigest(digest);
  const isClient = React.useSyncExternalStore(noopSubscribe, () => true, () => false);
  // no navegador: registra uma vez por erro (o mesmo objeto de erro devolve sempre o mesmo código)
  const ref = serverRef ?? (isClient ? reportClientError({ kind: "boundary", error }) : null);
  const offline = React.useSyncExternalStore(subscribeOnline, () => !navigator.onLine, () => false);
  const reloading = isClient && isChunkError(error) && shouldAutoReload();
  const [copied, setCopied] = React.useState<"code" | "email" | null>(null);
  const mailto = isClient ? supportMailto({ ref, locale, page: location.pathname, device: deviceSummary(navigator.userAgent) }) : `mailto:${SUPPORT_EMAIL}`;

  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") console.error(error);
    // site atualizado no meio do uso: recarrega uma vez sozinho (não entra em loop)
    if (reloading) {
      try {
        sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
      } catch {
        /* sem storage */
      }
      location.reload();
    }
  }, [error, reloading]);

  const flash = (k: "code" | "email") => {
    setCopied(k);
    window.setTimeout(() => setCopied(null), 1800);
  };
  const homeHref = home === "app" ? `/${locale}/hoy` : `/${locale}`;
  const Icon = offline ? WifiOff : TriangleAlert;

  return (
    <div role="alert" aria-live="assertive" className={cn("flex w-full justify-center px-4", fullPage ? "min-h-dvh items-center py-10" : "py-6")}>
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-ink/[0.06] bg-card shadow-soft">
        <div className="flex flex-col items-center gap-3 bg-mint-soft px-6 pb-6 pt-8 text-center">
          <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-card text-vivid-strong shadow-soft">
            <Icon aria-hidden="true" className="size-7" />
          </span>
          <h1 className="text-xl font-semibold">{reloading ? t.updating : offline ? t.offlineTitle : t.title}</h1>
          {!reloading ? <p className="max-w-sm text-muted-foreground">{offline ? t.offlineText : t.text}</p> : null}
        </div>

        <div className="space-y-5 p-6">
          <div className="grid gap-2 sm:grid-cols-2">
            {retry ? (
              <button
                type="button"
                onClick={() => (offline ? location.reload() : retry())}
                className="inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-primary bg-primary px-4 font-medium text-primary-foreground hover:bg-primary/85"
              >
                <RefreshCw aria-hidden="true" className="size-5" />
                {t.retry}
              </button>
            ) : null}
            <a href={homeHref} className={cn("inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-ink/15 bg-card px-4 font-medium hover:border-ink/40", !retry && "sm:col-span-2")}>
              <Home aria-hidden="true" className="size-5" />
              {t.home}
            </a>
          </div>

          {ref ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-mint-50 px-4 py-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{t.code}</p>
                <p className="truncate font-mono text-lg font-semibold tracking-wider">{ref}</p>
              </div>
              <button
                type="button"
                onClick={async () => (await copyText(ref)) && flash("code")}
                className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-ink/10 bg-card px-3 text-sm hover:border-ink/30"
              >
                {copied === "code" ? <CircleCheck aria-hidden="true" className="size-4 text-vivid-strong" /> : <Copy aria-hidden="true" className="size-4" />}
                {copied === "code" ? t.copied : t.copy}
              </button>
            </div>
          ) : null}

          <div className="rounded-2xl border border-ink/[0.08] p-4">
            <p className="font-medium">{t.helpTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.helpText}</p>
            <a href={mailto} className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-mint-100 px-5 font-medium text-accent-foreground hover:bg-mint-200">
              <Mail aria-hidden="true" className="size-5" />
              {t.mail}
            </a>
            <div className="mt-2 flex items-center justify-center gap-2 text-sm">
              <span className="font-mono text-muted-foreground">{SUPPORT_EMAIL}</span>
              <button type="button" onClick={async () => (await copyText(SUPPORT_EMAIL)) && flash("email")} className="min-h-11 rounded-full px-2 text-primary underline underline-offset-4">
                {copied === "email" ? t.copied : t.copyEmail}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
