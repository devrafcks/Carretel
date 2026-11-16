/** Conexão que o login (Better Auth) usa: a mesma do app (src/db/client.ts), sem abrir outro pool. */
import "server-only";
import { getDb, type DB } from "./client";

export type AuthDb = DB;

export function getAuthDb(): Promise<DB> {
  return getDb();
}
