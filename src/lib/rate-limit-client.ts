/** Lado do navegador: quantos minutos esperar depois de um 429 (Retry-After ou corpo da resposta). */
export function retryMinutes(res: Response, body?: { retryAfter?: number } | null): number | null {
  const header = Number(res.headers.get("retry-after"));
  const seconds = Number.isFinite(header) && header > 0 ? header : typeof body?.retryAfter === "number" ? body.retryAfter : NaN;
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return Math.max(1, Math.ceil(seconds / 60));
}
