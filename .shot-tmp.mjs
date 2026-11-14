import { chromium } from "@playwright/test";
const [url, out, w, h] = process.argv.slice(2);
const b = await chromium.launch({ channel: "msedge", headless: true });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
await p.route("**/seeb-widget.pages.dev/**", r => r.abort());
await p.goto(url, { waitUntil: "networkidle", timeout: 90000 });
const H = await p.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < H; y += 500) { await p.evaluate(v => window.scrollTo(0, v), y); await p.waitForTimeout(150); }
await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(1200);
await p.screenshot({ path: out, fullPage: true });
const errs = []; p.on("console", m => m.type() === "error" && errs.push(m.text()));
console.log("height", H);
await b.close();
