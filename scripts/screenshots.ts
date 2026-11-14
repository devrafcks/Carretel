/**
 * pnpm screenshots — captura as telas do manifest (390×844, dados FICTÍCIOS do "Taller Rosa")
 * usando o Microsoft Edge do sistema (sem baixar navegador). Requer `pnpm dev` rodando sem Neon Auth
 * (login de desenvolvimento).
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const BASE = process.env.SCREENSHOT_BASE_URL ?? "http://localhost:3000";
const EMAIL = "tallerrosa@exemplo.test";

async function main() {
  const out = path.join(process.cwd(), "public", "screenshots");
  mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, locale: "es-BO" });
  const page = await ctx.newPage();

  const send = await page.request.post(`${BASE}/api/dev-auth`, { data: { action: "send", email: EMAIL } });
  const { devCode } = (await send.json()) as { devCode: string };
  const verify = await page.request.post(`${BASE}/api/dev-auth`, { data: { action: "verify", email: EMAIL, code: devCode } });
  if (!verify.ok()) throw new Error("login falhou");

  // bloqueia o widget externo nas capturas
  await page.route("**/seeb-widget.pages.dev/**", (r) => r.abort());

  await page.goto(`${BASE}/es/hoy`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(out, "hoy.png") });
  console.log("✓ public/screenshots/hoy.png");

  await page.goto(`${BASE}/es/lotes?f=all`, { waitUntil: "networkidle" });
  const first = page.locator('a[href*="/es/lotes/"]').filter({ hasNotText: "Nuevo" }).first();
  await first.click();
  await page.waitForLoadState("networkidle");
  const proofHref = await page.locator('a[href*="/c/"]').first().getAttribute("href");
  if (proofHref) {
    await page.goto(`${BASE}${proofHref.replace("/pt-BR/", "/es/")}`, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(out, "comprobante.png") });
    console.log("✓ public/screenshots/comprobante.png");
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
