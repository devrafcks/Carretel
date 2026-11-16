/** Verificações de imagem no servidor (sem dependências). */

/**
 * JPEG: percorre os segmentos do cabeçalho até o início da imagem (SOS) e só acusa um APP1 que seja "Exif".
 * Procurar os bytes FF E1 soltos dava falso positivo (bloco XMP, bytes de tabelas) e recusava fotos limpas.
 */
export function jpegHasExif(buf: Buffer): boolean {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return false;
  let i = 2;
  while (i + 4 <= buf.length) {
    if (buf[i] !== 0xff) return false;
    const marker = buf[i + 1]!;
    if (marker === 0xff) {
      i++;
      continue;
    }
    if (marker === 0xda || marker === 0xd9) return false; // início dos dados da imagem / fim
    if (marker >= 0xd0 && marker <= 0xd7) {
      i += 2;
      continue;
    }
    const len = buf.readUInt16BE(i + 2);
    if (len < 2) return false;
    if (marker === 0xe1 && buf.subarray(i + 4, i + 10).equals(Buffer.from("Exif\0\0", "binary"))) return true;
    i += 2 + len;
  }
  return false;
}
