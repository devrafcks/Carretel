/**
 * Template OG/Twitter 1200×630 (next/og). HEX validados da paleta: fundo #FAF6EE, faixa #1C4066,
 * texto #121D29 (contraste AAA), creme #FEFCF8. Sem pessoas, sem dados reais, sem QR Pix verdadeiro.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { BRAND_HEX as C } from "@/config/brand-colors";

export const OG_SIZE = { width: 1200, height: 630 };

export async function ogFonts() {
  const dir = path.join(process.cwd(), "brand", "fonts");
  const [bold, semi] = await Promise.all([
    readFile(path.join(dir, "montserrat-latin-700-normal.woff")),
    readFile(path.join(dir, "montserrat-latin-600-normal.woff")),
  ]);
  return [
    { name: "Montserrat", data: bold.buffer.slice(bold.byteOffset, bold.byteOffset + bold.byteLength) as ArrayBuffer, weight: 700 as const, style: "normal" as const },
    { name: "Montserrat", data: semi.buffer.slice(semi.byteOffset, semi.byteOffset + semi.byteLength) as ArrayBuffer, weight: 600 as const, style: "normal" as const },
  ];
}

export function OgCard({ locale }: { locale: string }) {
  const es = locale === "es";
  const headline = es ? "El cuaderno de su taller." : "O caderno do seu taller.";
  const sub = es ? "Registre, compruebe y cobre." : "Registre, comprove e cobre.";
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", background: C.background, fontFamily: "Montserrat" }}>
      <div style={{ width: 28, height: "100%", background: C.primary, display: "flex" }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="72" height="72" viewBox="0 0 32 32" fill="none">
            <path d="M23.5 8.5A10 10 0 1 0 23.5 23.5" stroke={C.primary} strokeWidth="6" strokeLinecap="round" />
            <circle cx="16" cy="16" r="2.6" fill={C.accentForeground} />
            <path d="M27.2 23.5h2.3" stroke={C.accentForeground} strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 52, fontWeight: 700, color: C.primary, letterSpacing: -1.5 }}>carretel</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 76, fontWeight: 700, color: C.foreground, lineHeight: 1.05, letterSpacing: -1.5 }}>{headline}</div>
          <div style={{ fontSize: 76, fontWeight: 700, color: C.primary, lineHeight: 1.05, letterSpacing: -1.5 }}>{sub}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 14 }}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} style={{ width: 34, height: 6, borderRadius: 3, background: C.primary, display: "flex" }} />
            ))}
          </div>
          <div style={{ display: "flex", background: C.primary, color: C.primaryForeground, fontSize: 40, fontWeight: 700, padding: "14px 28px", borderRadius: 10 }}>
            R$ 35/mês
          </div>
        </div>
      </div>
    </div>
  );
}
