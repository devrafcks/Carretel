"use client";
/**
 * Compressão no cliente: WebP com lado maior ~1600px. Redesenhar no canvas descarta EXIF/GPS
 * (minimização LGPD). Fallback para JPEG se o navegador não exportar WebP.
 */
export async function compressImage(file: File, maxSide = 1600, quality = 0.8): Promise<{ blob: Blob; width: number; height: number }> {
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
  const width = Math.round(w0 * scale);
  const height = Math.round(h0 * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, width, height);
  const toBlob = (type: string) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, quality));
  let blob = await toBlob("image/webp");
  if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg");
  if (!blob) throw new Error("encode");
  return { blob, width, height };
}
