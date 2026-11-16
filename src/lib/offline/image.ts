"use client";
/**
 * Compressão no cliente antes de enviar (a foto fica no banco: cada KB conta).
 * - Redesenhar no canvas descarta EXIF/GPS (minimização LGPD).
 * - Lado maior até `maxSide` (1600px: nítido para conferir costura no celular), redução em alta qualidade.
 * - Alvo de ~140 KB por foto; qualidade começa em 0,78 e desce até 0,66 só se precisar.
 * - Qualidade adaptativa: começa alta e só desce (até um piso que não deixa artefato visível)
 *   enquanto o arquivo passar do alvo. Foto simples fica pequena sem perder nada; foto cheia de detalhe
 *   desce um ou dois degraus.
 * - WebP; fallback para JPEG se o navegador não exportar WebP (Safari antigo).
 */
import { pickEncoding } from "./image-steps";

export async function compressImage(
  file: File,
  maxSide = 1600,
  quality = 0.78,
  targetBytes = 140_000,
): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(async () => {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  });
  const w0 = "naturalWidth" in bitmap ? bitmap.naturalWidth : bitmap.width;
  const h0 = "naturalHeight" in bitmap ? bitmap.naturalHeight : bitmap.height;
  const scale = Math.min(1, maxSide / Math.max(w0, h0));
  const width = Math.max(1, Math.round(w0 * scale));
  const height = Math.max(1, Math.round(h0 * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, width, height);
  if ("close" in bitmap) bitmap.close();

  const encode = (type: string, q: number) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, q));
  // descobre uma vez se o navegador exporta WebP
  const probe = await encode("image/webp", quality);
  const type = probe && probe.type === "image/webp" ? "image/webp" : "image/jpeg";
  const first = type === "image/webp" ? probe : await encode("image/jpeg", quality);
  if (!first) throw new Error("encode");
  const blob = await pickEncoding(first, quality, targetBytes, (q) => encode(type, q));
  canvas.width = canvas.height = 0; // libera a memória do canvas (celulares com pouca RAM)
  return { blob, width, height };
}
