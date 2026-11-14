#!/usr/bin/env node
/**
 * Guardrails do projeto (rodam no `pnpm lint` e no CI):
 *  1. Zero hex hardcoded em src/components e src/app (exceto OG/Twitter/manifest).
 *  2. Zero backdrop-filter e zero middleware.ts em src.
 *  3. `@/db/client` (db cru) só dentro de src/db/.
 *  4. Rodapé de atribuição do brasil-legal-skills nunca na UI.
 *  5. Aviso (não erro) para dados legais vazios em src/config/legal.ts.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];
const warnings = [];

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|css|mjs|js)$/.test(name)) out.push(p);
  }
  return out;
}

const rel = (p) => path.relative(root, p).replaceAll("\\", "/");

// 1. hex
for (const f of [...walk(path.join(root, "src/components")), ...walk(path.join(root, "src/app"))]) {
  const r = rel(f);
  if (/(opengraph-image|twitter-image|manifest)\.tsx?$/.test(r)) continue;
  const src = readFileSync(f, "utf8");
  const m = src.match(/#[0-9A-Fa-f]{6}\b/g);
  if (m) errors.push(`${r}: hex hardcoded ${[...new Set(m)].join(", ")}`);
}

// 2. backdrop-filter / middleware.ts
for (const f of walk(path.join(root, "src"))) {
  const r = rel(f);
  if (r.endsWith("middleware.ts")) errors.push(`${r}: use src/proxy.ts (Next 16), não middleware.ts`);
  const src = readFileSync(f, "utf8");
  if (/backdrop-filter\s*:/.test(src) && !r.endsWith("tokens.css")) errors.push(`${r}: backdrop-filter proibido`);
  // 3. db cru
  if (!r.startsWith("src/db/") && /from\s+["']@\/db\/client["']/.test(src)) {
    errors.push(`${r}: import de @/db/client fora de src/db (use tenantDb)`);
  }
  // 4. rodapé do brasil-legal-skills
  if (/brasil-legal-skills/i.test(src) && !r.startsWith("src/db/")) errors.push(`${r}: rodapé/menção do brasil-legal-skills na UI`);
}

// 5. dados legais
const legal = readFileSync(path.join(root, "src/config/legal.ts"), "utf8");
for (const key of ["companyName", "cnpj", "address", "supportEmail", "dpoName", "dpoEmail", "taxRegime", "forumCity"]) {
  if (new RegExp(`${key}:\\s*""`).test(legal)) warnings.push(`legal.${key} vazio (preencher antes do go-live)`);
}

for (const w of warnings) console.warn(`⚠ ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`✖ ${e}`);
  process.exit(1);
}
console.log(`✓ guardrails ok (${warnings.length} aviso(s) de placeholder legal)`);
