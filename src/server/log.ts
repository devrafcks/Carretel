/**
 * Registro de erros do servidor. Cada erro:
 *  1) sai em uma linha JSON no log da Vercel (Runtime Logs), com o código (ref) para achar depois;
 *  2) é gravado na tabela error_logs (painel /admin/erros), já sem segredos (src/lib/error-report.ts).
 * Nunca lança: registrar um erro não pode virar outro erro. Banco fora do ar → fica só no log da Vercel.
 */
import "server-only";
import { after } from "next/server";
import { errorFingerprint, newErrorRef, scrub } from "@/lib/error-report";

export type LogSource = "render" | "route" | "action" | "proxy" | "webhook" | "cron" | "client" | "boundary" | "auth" | "billing" | "storage" | "sync" | "email" | "system";

export type LogOptions = {
  source: LogSource;
  level?: "error" | "warn";
  ref?: string;
  digest?: string | null;
  path?: string | null;
  method?: string | null;
  userId?: string | null;
  workshopId?: string | null;
  userAgent?: string | null;
  /** detalhes extras (ids, tipo do evento…). Nada de senha, token ou corpo de formulário. */
  context?: Record<string, unknown>;
  /** procura quem está logado e a página (pelos cabeçalhos do pedido). Padrão: sim. */
  lookupRequest?: boolean;
};

/** Mesmo erro repetindo sem parar (ex.: banco caiu) não enche a tabela: até 20 gravações por minuto por instância. */
const recent = new Map<string, { at: number; n: number }>();
function throttled(fp: string): boolean {
  const now = Date.now();
  const r = recent.get(fp);
  if (!r || now - r.at > 60_000) {
    recent.set(fp, { at: now, n: 1 });
    if (recent.size > 500) recent.clear();
    return false;
  }
  r.n++;
  return r.n > 20;
}

function errParts(err: unknown): { name: string; message: string; stack: string | null; digest: string | null } {
  if (err instanceof Error) {
    const digest = "digest" in err && typeof (err as { digest?: unknown }).digest === "string" ? (err as { digest: string }).digest : null;
    const cause = err.cause instanceof Error ? `\n[causa] ${err.cause.name}: ${err.cause.message}` : "";
    return { name: err.name, message: `${err.message}${cause}`, stack: err.stack ?? null, digest };
  }
  if (typeof err === "object" && err !== null) {
    try {
      return { name: "Object", message: JSON.stringify(err).slice(0, 1000), stack: null, digest: null };
    } catch {
      /* circular */
    }
  }
  return { name: typeof err, message: String(err), stack: null, digest: null };
}

/** Página e aparelho do pedido atual (Server Action: a página que chamou vem no referer). */
async function requestInfo(): Promise<{ path: string | null; method: string | null; userAgent: string | null; userId: string | null }> {
  const out = { path: null as string | null, method: null as string | null, userAgent: null as string | null, userId: null as string | null };
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    out.userAgent = h.get("user-agent");
    const ref = h.get("referer");
    if (ref) {
      try {
        const u = new URL(ref);
        out.path = u.pathname + (u.search ? "?…" : "");
      } catch {
        /* referer inválido */
      }
    }
    if (h.get("next-action")) out.method = "ACTION";
  } catch {
    return out; // fora de um pedido (cron interno, script)
  }
  try {
    const { getSessionUser } = await import("@/lib/auth/server");
    out.userId = (await getSessionUser())?.id ?? null;
  } catch {
    /* sem sessão ou banco fora */
  }
  return out;
}

/** Registra e devolve o código do erro. Pode (e deve) ser aguardado em rotas; em ações rápidas use reportError. */
export async function logError(event: string, err: unknown, opts: LogOptions): Promise<string> {
  const ref = opts.ref ?? newErrorRef();
  try {
    const p = errParts(err);
    const message = scrub(`${p.name === "Error" ? "" : `${p.name}: `}${p.message}`, 2000);
    const stack = scrub(p.stack, 6000);
    const fp = errorFingerprint(event, message);
    const req = opts.lookupRequest === false ? null : await requestInfo();
    const row = {
      ref,
      fingerprint: fp,
      level: opts.level ?? "error",
      source: opts.source,
      event: event.slice(0, 120),
      message,
      stack,
      digest: opts.digest ?? p.digest,
      path: scrub(opts.path ?? req?.path ?? null, 500),
      method: opts.method ?? req?.method ?? null,
      userId: opts.userId ?? req?.userId ?? null,
      workshopId: opts.workshopId && /^[0-9a-f-]{36}$/i.test(opts.workshopId) ? opts.workshopId : null,
      userAgent: (opts.userAgent ?? req?.userAgent ?? null)?.slice(0, 400) ?? null,
      context: opts.context ? (JSON.parse(scrub(JSON.stringify(opts.context), 4000) ?? "{}") as Record<string, unknown>) : null,
    };
    const line = { level: row.level, msg: row.event, ref, source: row.source, err: message, path: row.path, digest: row.digest, userId: row.userId, ...(opts.context ? { ctx: row.context } : {}) };
    if (row.level === "warn") console.warn(JSON.stringify(line));
    else console.error(JSON.stringify(line));
    if (throttled(fp)) return ref;
    const [{ getDb }, { errorLogs }] = await Promise.all([import("@/db/client"), import("@/db/schema")]);
    const db = await getDb();
    await db.insert(errorLogs).values(row);
  } catch (e) {
    console.error(JSON.stringify({ level: "error", msg: "error_log_failed", ref, err: String(e).slice(0, 300) }));
  }
  return ref;
}

export function logWarn(event: string, err: unknown, opts: LogOptions): Promise<string> {
  return logError(event, err, { ...opts, level: "warn" });
}

/**
 * Versão síncrona para os catch das ações: devolve o código na hora e grava depois da resposta (after),
 * para a pessoa não esperar o registro. Fora de um pedido, grava em segundo plano.
 */
export function reportError(event: string, err: unknown, opts: LogOptions): string {
  const ref = opts.ref ?? newErrorRef();
  const run = () => logError(event, err, { ...opts, ref });
  try {
    after(run);
  } catch {
    void run();
  }
  return ref;
}
