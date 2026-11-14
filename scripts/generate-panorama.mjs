/**
 * node scripts/generate-panorama.mjs — gera public/illustrations/hero-panorama.svg
 * "Cânions de tecido": pilhas de tecido dobrado em camadas emoldurando o hero (centro livre para o texto),
 * com carretéis e plantas no topo, camadas distantes mais claras (perspectiva atmosférica) e névoa.
 */
import { writeFileSync } from "node:fs";

const W = 1600;
const H = 760;

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FABRIC = [
  ["#F4B9A2", "#E39A80"],
  ["#EED7B5", "#D9BD95"],
  ["#A9DCC4", "#84C4A8"],
  ["#E58A6C", "#C96F53"],
  ["#FBF3E6", "#E9DCC6"],
  ["#5FB38E", "#479A76"],
  ["#B9CFEA", "#97B3D8"],
  ["#F6CF8A", "#E3B567"],
];
const GREENS = ["#4FA57E", "#6CBF95", "#3E8E6A", "#8FD1AE", "#2F7A58"];

/** Pilha de tecido: cada camada é uma faixa com a borda dobrada (arredondada) voltada para o centro. */
function cliff({ side, seed, baseX, width, top, opacity = 1, scale = 1 }) {
  const r = rng(seed);
  let y = H;
  let out = "";
  let i = Math.floor(r() * FABRIC.length);
  const tops = [];
  while (y > top) {
    const h = (22 + r() * 30) * scale;
    const progress = (H - y) / (H - top);
    const w = width * (1 - progress * 0.35) * (0.86 + r() * 0.22);
    const [fill, shade] = FABRIC[i % FABRIC.length];
    i += 1 + Math.floor(r() * 2);
    const yy = y - h;
    const rx = h / 2;
    let x;
    let path;
    if (side === "left") {
      x = baseX - 40;
      path = `M${x} ${yy} H${x + w - rx} A${rx} ${rx} 0 0 1 ${x + w - rx} ${y} H${x} Z`;
    } else {
      x = baseX + 40;
      path = `M${x} ${yy} H${x - w + rx} A${rx} ${rx} 0 0 0 ${x - w + rx} ${y} H${x} Z`;
    }
    out += `<path d="${path}" fill="${fill}"/>`;
    // sombra na base da dobra
    const sh = h * 0.22;
    if (side === "left") {
      out += `<path d="M${x} ${y - sh} H${x + w - rx * 0.6} A${rx} ${rx} 0 0 1 ${x + w - rx} ${y} H${x} Z" fill="${shade}" opacity="0.9"/>`;
    } else {
      out += `<path d="M${x} ${y - sh} H${x - w + rx * 0.6} A${rx} ${rx} 0 0 0 ${x - w + rx} ${y} H${x} Z" fill="${shade}" opacity="0.9"/>`;
    }
    // costura em algumas camadas
    if (r() > 0.55) {
      const sy = yy + h * 0.42;
      const x1 = side === "left" ? x + 20 : x - w + rx + 10;
      const x2 = side === "left" ? x + w - rx - 10 : x - 20;
      out += `<path d="M${x1} ${sy} H${x2}" stroke="#FFFFFF" stroke-opacity="0.75" stroke-width="${2.4 * scale}" stroke-dasharray="${10 * scale} ${8 * scale}" stroke-linecap="round"/>`;
    }
    tops.push({ y: yy, w, x });
    y = yy - 1;
  }
  const last = tops[tops.length - 1];
  return { svg: `<g opacity="${opacity}">${out}</g>`, topY: last.y, topW: last.w, topX: last.x };
}

function bush(cx, cy, s, seed, palette = GREENS) {
  const r = rng(seed);
  let out = "";
  for (let k = 0; k < 7; k++) {
    const dx = (r() - 0.5) * 70 * s;
    const dy = (r() - 0.6) * 34 * s;
    const rad = (16 + r() * 22) * s;
    out += `<circle cx="${(cx + dx).toFixed(1)}" cy="${(cy + dy).toFixed(1)}" r="${rad.toFixed(1)}" fill="${palette[Math.floor(r() * palette.length)]}"/>`;
  }
  return out;
}

function spool(x, y, s, body, flange = "#3A2E2A") {
  const w = 54 * s;
  const h = 70 * s;
  let out = `<rect x="${x - w / 2}" y="${y - h}" width="${w}" height="${12 * s}" rx="${5 * s}" fill="${flange}"/>`;
  out += `<rect x="${x - w / 2 + 8 * s}" y="${y - h + 12 * s}" width="${w - 16 * s}" height="${h - 24 * s}" fill="${body}"/>`;
  for (let k = 1; k < 5; k++) {
    const ly = y - h + 12 * s + (k * (h - 24 * s)) / 5;
    out += `<path d="M${x - w / 2 + 8 * s} ${ly} H${x + w / 2 - 8 * s}" stroke="#000" stroke-opacity="0.12" stroke-width="${2 * s}"/>`;
  }
  out += `<rect x="${x - w / 2}" y="${y - 12 * s}" width="${w}" height="${12 * s}" rx="${5 * s}" fill="${flange}"/>`;
  return out;
}

function leaf(x, y, h, angle, color) {
  return `<path d="M${x} ${y} C ${x - 18} ${y - h * 0.45}, ${x - 6} ${y - h * 0.85}, ${x} ${y - h} C ${x + 6} ${y - h * 0.85}, ${x + 18} ${y - h * 0.45}, ${x} ${y} Z" fill="${color}" transform="rotate(${angle} ${x} ${y})"/>`;
}

let body = "";
// névoa de fundo (horizonte)
body += `<defs>
  <linearGradient id="pan-haze" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity="0"/>
    <stop offset="1" stop-color="#E7F4EC" stop-opacity="0.9"/>
  </linearGradient>
</defs>`;
body += `<rect x="0" y="${H * 0.55}" width="${W}" height="${H * 0.45}" fill="url(#pan-haze)"/>`;

// camadas distantes (mais claras)
const farL = cliff({ side: "left", seed: 11, baseX: 230, width: 300, top: 300, opacity: 0.35, scale: 0.8 });
const farR = cliff({ side: "right", seed: 23, baseX: W - 230, width: 300, top: 260, opacity: 0.35, scale: 0.8 });
body += farL.svg + farR.svg;
body += `<g opacity="0.35">${bush(330, farL.topY + 8, 0.7, 5)}${bush(W - 330, farR.topY + 8, 0.7, 6)}</g>`;

// penhascos próximos
const L = cliff({ side: "left", seed: 3, baseX: 0, width: 420, top: 150 });
const R = cliff({ side: "right", seed: 7, baseX: W, width: 440, top: 120 });
body += L.svg + R.svg;

// topo: carretéis + arbustos
body += bush(130, L.topY + 10, 1.1, 41);
body += spool(250, L.topY + 16, 1.1, "#5FB38E");
body += spool(312, L.topY + 16, 0.8, "#E58A6C");
body += bush(W - 150, R.topY + 10, 1.2, 42);
body += spool(W - 280, R.topY + 18, 1.25, "#F6CF8A");
// linha saindo do carretel e descendo pela lateral
body += `<path d="M${W - 250} ${R.topY - 40} C ${W - 140} ${R.topY - 10}, ${W - 60} ${R.topY + 80}, ${W - 20} ${R.topY + 160}" fill="none" stroke="#E58A6C" stroke-width="3" stroke-linecap="round"/>`;

// vegetação em primeiro plano
body += bush(60, H - 30, 1.6, 51);
body += bush(240, H - 10, 1.3, 52);
body += bush(W - 70, H - 30, 1.7, 53);
body += bush(W - 260, H - 6, 1.2, 54);
for (let k = 0; k < 9; k++) {
  body += leaf(20 + k * 32, H, 90 + (k % 3) * 40, -30 + k * 8, GREENS[k % GREENS.length]);
  body += leaf(W - 20 - k * 32, H, 90 + (k % 3) * 40, 30 - k * 8, GREENS[(k + 2) % GREENS.length]);
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" aria-hidden="true">${body}</svg>`;
writeFileSync(new URL("../public/illustrations/hero-panorama.svg", import.meta.url), svg);
console.log("✓ public/illustrations/hero-panorama.svg", (svg.length / 1024).toFixed(1) + " KB");
