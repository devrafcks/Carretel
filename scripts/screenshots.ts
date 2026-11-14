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

  await page.goto(`${BASE}/es/lotes?f=all`, { waitUntil: "networkidle" });
  await page.locator('main a[href*="/es/lotes/"]').filter({ hasNotText: "+" }).first().click();
  await page.waitForLoadState("networkidle");
  const proofHref = await page.locator('a[href*="/c/"]').first().getAttribute("href");
  for (const [loc, suffix] of [["es", ""], ["pt-BR", "-pt"]] as const) {
    await page.goto(`${BASE}/${loc}/hoy`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(out, `hoy${suffix}.png`) });
    console.log(`✓ public/screenshots/hoy${suffix}.png`);
    if (proofHref) {
      await page.goto(`${BASE}${proofHref.replace(/^\/(es|pt-BR)\//, `/${loc}/`)}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(out, `comprobante${suffix}.png`) });
      console.log(`✓ public/screenshots/comprobante${suffix}.png`);
    }
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
