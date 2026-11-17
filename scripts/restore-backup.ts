/**
 * Restaura uma cópia do banco (arquivo .json.gz baixado do /admin) no banco do DATABASE_URL_UNPOOLED.
 *   Ensaio (não muda nada: restaura numa transação, confere e desfaz):
 *     pnpm tsx --conditions=react-server --env-file=.env.local scripts/restore-backup.ts caminho/carretel-AAAA-MM-DD.json.gz
 *   De verdade (APAGA os dados atuais das tabelas e coloca os da cópia):
 *     ... scripts/restore-backup.ts caminho/arquivo.json.gz --confirmar
 * Gatilhos e chaves estrangeiras ficam pausados durante a carga (session_replication_role = replica).
 */
import fs from "node:fs";
import { gunzipSync } from "node:zlib";
import { Client, types } from "pg";
import { SUPABASE_CA, isSupabaseUrl } from "../src/db/supabase-ca";

const RAW_DATE_OIDS = new Set([1082, 1083, 1114, 1184, 1266]);
const rawTypes = { getTypeParser: (oid: number, fmt?: "text" | "binary") => (RAW_DATE_OIDS.has(oid) ? (v: string) => v : types.getTypeParser(oid, fmt as "text")) };

type Backup = { format: number; createdAt: string; tables: Record<string, Record<string, unknown>[]> };

function decode(row: Record<string, unknown>) {
  const o: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    o[k] = v && typeof v === "object" && "$b64" in (v as object) ? "\\x" + Buffer.from((v as { $b64: string }).$b64, "base64").toString("hex") : v;
  }
  return o;
}

async function main() {
  const [file, flag] = process.argv.slice(2);
  if (!file) throw new Error("uso: restore-backup.ts <arquivo.json.gz> [--confirmar]");
  const real = flag === "--confirmar";
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) throw new Error("falta DATABASE_URL_UNPOOLED");
  const backup = JSON.parse(gunzipSync(fs.readFileSync(file)).toString("utf8")) as Backup;
  if (backup.format !== 1) throw new Error(`formato de cópia desconhecido: ${backup.format}`);
  console.log(`cópia de ${backup.createdAt} · ${Object.keys(backup.tables).length} tabelas · modo: ${real ? "RESTAURAR DE VERDADE" : "ensaio (desfaz no fim)"}`);

  const c = new Client({ connectionString: url, ssl: isSupabaseUrl(url) ? { ca: SUPABASE_CA, rejectUnauthorized: true } : undefined, types: rawTypes });
  await c.connect();
  await c.query("begin");
  await c.query("set local session_replication_role = replica");
  const names = Object.keys(backup.tables).filter((t) => t !== "drizzle.__drizzle_migrations");
  const existing = new Set((await c.query(`select schemaname || '.' || tablename n from pg_tables`)).rows.map((r) => r.n as string));
  const missing = names.filter((n) => !existing.has(n));
  if (missing.length) throw new Error("tabelas da cópia que não existem no banco (rode as migrações antes): " + missing.join(", "));
  const quoted = (n: string) => n.split(".").map((p) => `"${p}"`).join(".");
  await c.query(`truncate ${names.map(quoted).join(", ")}`);

  let total = 0;
  for (const n of names) {
    const rows = backup.tables[n]!.map(decode);
    if (!rows.length) continue;
    const cols = (await c.query(`select column_name from information_schema.columns where table_schema = $1 and table_name = $2 and is_generated = 'NEVER'`, n.split("."))).rows.map((r) => r.column_name as string);
    const use = cols.filter((col) => col in rows[0]!);
    const list = use.map((x) => `"${x}"`).join(", ");
    for (let i = 0; i < rows.length; i += 200) {
      await c.query(`insert into ${quoted(n)} (${list}) select ${list} from json_populate_recordset(null::${quoted(n)}, $1::json)`, [JSON.stringify(rows.slice(i, i + 200))]);
    }
    const got = (await c.query(`select count(*)::int n from ${quoted(n)}`)).rows[0]!.n as number;
    if (got !== rows.length) throw new Error(`${n}: esperava ${rows.length} linhas, ficaram ${got}`);
    total += got;
  }
  if (real) {
    await c.query("commit");
    console.log(`restaurado: ${total} linhas em ${names.length} tabelas`);
  } else {
    await c.query("rollback");
    console.log(`ensaio ok: ${total} linhas conferidas em ${names.length} tabelas; nada foi alterado`);
  }
  await c.end();
}

main().catch((e) => {
  console.error("ERRO:", e instanceof Error ? e.message : e);
  process.exit(1);
});
