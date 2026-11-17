/**
 * Todo erro que o Next captura no servidor (página, rota, Server Action, proxy) passa aqui e vai para o
 * registro de erros (log da Vercel + /admin/erros). O digest gravado é o mesmo que a tela de erro mostra como código.
 */
import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  // redirect() e notFound() viajam como "erro" mas não são problema
  const digest = typeof err === "object" && err !== null && "digest" in err ? String((err as { digest: unknown }).digest) : null;
  if (digest && /^NEXT_(REDIRECT|NOT_FOUND|HTTP_ERROR_FALLBACK)/.test(digest)) return;
  try {
    const { logError } = await import("@/server/log");
    const ua = request.headers["user-agent"];
    await logError(`${context.routeType}_error`, err, {
      source: context.routeType === "action" ? "action" : context.routeType === "proxy" ? "proxy" : context.routeType === "route" ? "route" : "render",
      ref: digest ?? undefined,
      digest,
      path: request.path.split("?")[0],
      method: request.method,
      userAgent: Array.isArray(ua) ? ua[0] : ua,
      context: { route: context.routePath, renderSource: context.renderSource ?? null },
    });
  } catch (e) {
    console.error(JSON.stringify({ level: "error", msg: "on_request_error_failed", err: String(e).slice(0, 300) }));
  }
};
