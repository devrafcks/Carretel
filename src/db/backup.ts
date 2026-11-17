/**
 * Cópia completa do banco (todas as tabelas do app e do login) em JSON.
 * Datas saem como TEXTO cru do Postgres (sem perder microssegundos); bytea vira { "$b64": "..." }.
 * Só leitura. Usado pelo backup diário (src/server/backup.ts) e pelo script de restauração.
 */
import "server-only";
import { types as pgTypes } from "pg";
import { getDb } from "./client";

export const BACKUP_SCHEMAS = ["public", "app_auth", "drizzle"] as const;
export const BACKUP_FORMAT = 1;

export type BackupFile = {
  format: number;
  createdAt: string;
  tables: Record<string, Record<string, unknown>[]>;
};

const RAW_DATE_OIDS = new Set([1082, 1083, 1114, 1184, 1266]);
const rawTypes = { getTypeParser: (oid: number, fmt?: "text" | "binary") => (RAW_DATE_OIDS.has(oid) ? (v: string) => v : pgTypes.getTypeParser(oid, fmt as "text")) };

type Queryable = { query: (cfg: { text: string; values?: unknown[]; types?: unknown }) => Promise<{ rows: Record<string, unknown>[] }> };

export async function dumpDatabase(): Promise<BackupFile> {
  const db = await getDb();
  const pool = (db as unknown as { $client: Queryable }).$client;
  const q = (text: string, values: unknown[] = []) => pool.query({ text, values, types: rawTypes });
  const tablesRes = await q(`select schemaname, tablename from pg_tables where schemaname = any($1) order by 1, 2`, [BACKUP_SCHEMAS]);
  const tables: BackupFile["tables"] = {};
  for (const t of tablesRes.rows as { schemaname: string; tablename: string }[]) {
    const { rows } = await q(`select * from "${t.schemaname}"."${t.tablename}"`);
    tables[`${t.schemaname}.${t.tablename}`] = rows.map((r) => {
      const o: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(r)) o[k] = Buffer.isBuffer(v) ? { $b64: v.toString("base64") } : v;
      return o;
    });
  }
  return { format: BACKUP_FORMAT, createdAt: new Date().toISOString(), tables };
}
