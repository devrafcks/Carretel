/**
 * pnpm icons — gera os ícones PWA/Apple a partir dos SVGs da marca (sharp).
 *  public/icons/icon-192.png          192×192, fundo opaco índigo
 *  public/icons/icon-512.png          512×512
 *  public/icons/icon-512-maskable.png 512×512, marca dentro da safe zone central de 80% (círculo r=204)
 *  src/app/apple-icon.png             180×180 opaco
 *  src/app/favicon.ico                16/32/48 (PNG embutido)
 * Cores: HEX validados da paleta (#1C4066 primary, #FEFCF8 primary-foreground).
 */
import sharp from "sharp";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const INDIGO = "#1C4066";
const CREAM = "#FEFCF8";

// Traço da marca (mesma geometria de brand/logo-mark.svg), em creme
const MARK_PATHS =
  '<g fill="none" stroke="' +
  CREAM +
  '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M7 5h13l5 5v17H7z"/><path d="M20 5v5h5"/><path d="M10.5 16h2.5M15 16h2.5"/>' +
  '<path d="M19.5 16h1a1.5 1.5 0 0 1 1.5 1.5V23"/></g>';

/** Ícone com a marca ocupando `markRatio` do lado (a marca vai de x=7..25, y=5..27 na grade 32). */
function iconSvg(size: number, markRatio: number): string {
  const markBox = size * markRatio;
  const scale = markBox / 22; // conteúdo útil ≈ 22 unidades (5..27)
  const offset = (size - 32 * scale) / 2;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<rect width="${size}" height="${size}" fill="${INDIGO}"/>` +
    `<g transform="translate(${offset} ${offset}) scale(${scale})">${MARK_PATHS}</g></svg>`
  );
}

async function png(svg: string, out: string, size: number) {
  mkdirSync(path.dirname(out), { recursive: true });
  await sharp(Buffer.from(svg)).resize(size, size).flatten({ background: INDIGO }).png({ compressionLevel: 9 }).toFile(out);
  console.log("✓", path.relative(root, out));
}

function ico(pngs: { size: number; data: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  const dir = Buffer.alloc(16 * pngs.length);
  let offset = 6 + dir.length;
  pngs.forEach((p, i) => {
    const o = i * 16;
    dir.writeUInt8(p.size >= 256 ? 0 : p.size, o);
    dir.writeUInt8(p.size >= 256 ? 0 : p.size, o + 1);
    dir.writeUInt8(0, o + 2);
    dir.writeUInt8(0, o + 3);
    dir.writeUInt16LE(1, o + 4);
    dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(p.data.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += p.data.length;
  });
  return Buffer.concat([header, dir, ...pngs.map((p) => p.data)]);
}

async function main() {
  // "any": marca grande (68% do lado)
  await png(iconSvg(192, 0.68), path.join(root, "public/icons/icon-192.png"), 192);
  await png(iconSvg(512, 0.68), path.join(root, "public/icons/icon-512.png"), 512);
  // maskable: a caixa da marca (diagonal) precisa caber no círculo de raio 204px → lado ≤ 288px (56%)
  await png(iconSvg(512, 0.52), path.join(root, "public/icons/icon-512-maskable.png"), 512);
  await png(iconSvg(180, 0.64), path.join(root, "src/app/apple-icon.png"), 180);

  const sizes = [16, 32, 48];
  const pngs = await Promise.all(
    sizes.map(async (s) => ({ size: s, data: await sharp(Buffer.from(iconSvg(s, 0.8))).resize(s, s).png().toBuffer() })),
  );
  writeFileSync(path.join(root, "src/app/favicon.ico"), ico(pngs));
  console.log("✓ src/app/favicon.ico");

  // checagem da safe zone do maskable: a marca precisa caber no círculo central r=204
  const ratio = 0.52;
  const half = (512 * ratio) / 2;
  const diag = Math.sqrt(2) * half;
  if (diag > 204) throw new Error(`maskable fora da safe zone: ${diag.toFixed(1)}px > 204px`);
  console.log(`✓ maskable safe zone: semi-diagonal ${diag.toFixed(1)}px ≤ 204px`);
  readFileSync(path.join(root, "brand/logo-mark.svg"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
