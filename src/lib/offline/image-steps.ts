/**
 * Degraus de qualidade da compressão (puro, testável). Desce só o necessário para caber no alvo
 * e nunca abaixo do piso: abaixo de ~0,66 o WebP/JPEG começa a borrar costuras e etiquetas.
 */
export const QUALITY_FLOOR = 0.66;
export const QUALITY_STEP = 0.08;

export function nextQualities(start: number, floor = QUALITY_FLOOR, step = QUALITY_STEP): number[] {
  const out: number[] = [];
  for (let q = start - step; q >= floor - 1e-9; q -= step) out.push(Math.round(q * 100) / 100);
  return out;
}

/** Fica com o primeiro arquivo que cabe no alvo; se nenhum couber, o menor (no piso de qualidade). */
export async function pickEncoding(first: Blob, start: number, targetBytes: number, encode: (q: number) => Promise<Blob | null>): Promise<Blob> {
  let best = first;
  if (best.size <= targetBytes) return best;
  for (const q of nextQualities(start)) {
    const b = await encode(q);
    if (!b) break;
    if (b.size < best.size) best = b;
    if (best.size <= targetBytes) break;
  }
  return best;
}
