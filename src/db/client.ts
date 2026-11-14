/**
 * Conexão crua com o banco. NÃO importe fora de src/db/ (regra de lint + guardrail):
 * use tenantDb(workshopId) (src/db/tenant.ts) ou as funções de src/db/public.ts.
 *
 * - Com DATABASE_URL (Neon, pooled): node-postgres (`pg`) + attachDatabasePool da Vercel
 *   (recomendação da skill neon-postgres para Next na Vercel; suporta transações).
 * - Sem DATABASE_URL: PGlite (Postgres em WASM) persistido em .data/pglite, com as
 *   mesmas migrações. Serve para desenvolvimento offline e para os testes.
 */
import "server-only";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export type DB = NodePgDatabase<typeof schema>;

type G = typeof globalThis & { __carretelDb?: Promise<DB> };
const g = globalThis as G;

async function createNeonDb(url: string): Promise<DB> {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: url, max: 5, idleTimeoutMillis: 10_000 });
  try {
    const { attachDatabasePool } = await import("@vercel/functions");
    attachDatabasePool(pool);
  } catch {
    /* fora da Vercel: ok */
  }
  return drizzlePg(pool, { schema });
}

async function createLocalDb(): Promise<DB> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const path = await import("node:path");
  const dataDir = process.env.PGLITE_DATA_DIR ?? path.join(process.cwd(), ".data", "pglite");
  if (dataDir !== "memory://") {
    const fs = await import("node:fs");
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const client = dataDir === "memory://" ? new PGlite() : new PGlite(dataDir);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return db as unknown as DB;
}

export function getDb(): Promise<DB> {
  if (!g.__carretelDb) {
    const url = process.env.DATABASE_URL;
    g.__carretelDb = url ? createNeonDb(url) : createLocalDb();
    g.__carretelDb.catch(() => {
      g.__carretelDb = undefined;
    });
  }
  return g.__carretelDb;
}

export { dbMode } from "./mode";
