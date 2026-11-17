/**
 * Envia erros do navegador para /api/client-errors (que grava em /admin/erros).
 * Filtra o ruído que não é nosso (extensões, widget de acessibilidade de terceiros, "Script error." sem detalhe)
 * e manda no máximo 8 por página aberta, sem repetir a mesma mensagem.
 */
import { newErrorRef } from "./error-report";

/** Mesmo erro (a tela de erro desenha mais de uma vez, às vezes com outra cópia do erro) → mesmo código, enviado uma vez só. */
const sent = new Map<string, string>();
let budget = 8;

const NOISE = [
  /ResizeObserver loop/i,
  /^Script error\.?$/im,
  /chrome-extension:|moz-extension:|safari-(web-)?extension:/i,
  /seeb-widget/i,
  /AbortError|The user aborted a request|signal is aborted/i,
  /NEXT_REDIRECT|NEXT_NOT_FOUND/,
];

export function isNoise(message: string, stack?: string | null): boolean {
  const text = `${message}\n${stack ?? ""}`;
  return NOISE.some((re) => re.test(text));
}

/** Erro de "pedaço do site" que sumiu depois de uma atualização: recarregar resolve. */
export function isChunkError(e: unknown): boolean {
  const m = e instanceof Error ? `${e.name} ${e.message}` : String(e);
  return /ChunkLoadError|Loading chunk [\w-]+ failed|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(m);
}

export function reportClientError(input: { kind: "boundary" | "error" | "rejection"; error: unknown; ref?: string; digest?: string | null }): string {
  const ref = input.ref ?? newErrorRef();
  try {
    const e = input.error;
    const name = e instanceof Error ? e.name : typeof e;
    const message = e instanceof Error ? e.message : typeof e === "string" ? e : (() => { try { return JSON.stringify(e); } catch { return String(e); } })();
    const stack = e instanceof Error ? e.stack : undefined;
    if (isNoise(message ?? "", stack)) return ref;
    const key = `${input.kind}|${name}|${message}`.slice(0, 500);
    const known = sent.get(key);
    if (known) return known;
    if (budget <= 0) return ref;
    sent.set(key, ref);
    budget--;
    const body = JSON.stringify({
      ref,
      kind: input.kind,
      name: (name || "Error").slice(0, 120),
      message: (message || "(sem mensagem)").slice(0, 2000),
      stack: stack?.slice(0, 8000),
      digest: input.digest ?? undefined,
      path: location.pathname,
      online: navigator.onLine,
      build: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
    });
    const blob = new Blob([body], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/client-errors", blob)) {
      void fetch("/api/client-errors", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => undefined);
    }
  } catch {
    /* registrar nunca pode quebrar a tela */
  }
  return ref;
}
