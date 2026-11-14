/**
 * tenantDb(workshopId): ÚNICA porta de entrada para queries de negócio.
 * Toda leitura/escrita recebe o filtro `workshop_id = :ws` injetado e todo insert
 * recebe `workshopId` à força. Não há como ler outra oficina por aqui.
 */
import "server-only";
import { and, eq, type SQL } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { getDb, type DB } from "./client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyTenantTable = PgTable & { workshopId: PgColumn<any> };
type Row<T extends AnyTenantTable> = T["$inferSelect"];
type NewRow<T extends AnyTenantTable> = Omit<T["$inferInsert"], "workshopId">;

export class TenantNotFoundError extends Error {
  constructor(what: string) {
    super(`not_found:${what}`);
  }
}

export type Scope = <T extends AnyTenantTable>(table: T) => SQL;

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface TenantDb {
  workshopId: string;
  scope: Scope;
  where<T extends AnyTenantTable>(table: T, ...conds: (SQL | undefined)[]): SQL;
  select<T extends AnyTenantTable>(
    table: T,
    cond?: SQL,
    opts?: { orderBy?: SQL | PgColumn | (SQL | PgColumn)[]; limit?: number },
  ): Promise<Row<T>[]>;
  first<T extends AnyTenantTable>(table: T, cond?: SQL): Promise<Row<T> | undefined>;
  get<T extends AnyTenantTable>(table: T, cond: SQL, what?: string): Promise<Row<T>>;
  insert<T extends AnyTenantTable>(table: T, values: NewRow<T>): Promise<Row<T>>;
  insertMany<T extends AnyTenantTable>(table: T, values: NewRow<T>[]): Promise<Row<T>[]>;
  insertIdempotent<T extends AnyTenantTable & { clientMutationId: PgColumn<any> }>(
    table: T,
    values: NewRow<T> & { clientMutationId: string },
  ): Promise<{ row: Row<T>; duplicate: boolean }>;
  update<T extends AnyTenantTable>(table: T, set: Partial<NewRow<T>>, cond: SQL): Promise<Row<T>[]>;
  delete<T extends AnyTenantTable>(table: T, cond: SQL): Promise<number>;
  query<R>(fn: (db: DB, s: Scope) => Promise<R>): Promise<R>;
  transaction<R>(fn: (tx: TenantDb) => Promise<R>): Promise<R>;
}

function build(db: DB, workshopId: string): TenantDb {
  const scope: Scope = (table) => eq(table.workshopId, workshopId);
  const where = <T extends AnyTenantTable>(table: T, ...conds: (SQL | undefined)[]): SQL =>
    and(scope(table), ...conds) as SQL;

  const api: TenantDb = {
    workshopId,
    scope,
    where,

    async select<T extends AnyTenantTable>(
      table: T,
      cond?: SQL,
      opts: { orderBy?: SQL | PgColumn | (SQL | PgColumn)[]; limit?: number } = {},
    ): Promise<Row<T>[]> {
      let q: any = (db as any).select().from(table).where(where(table, cond));
      if (opts.orderBy) q = q.orderBy(...(Array.isArray(opts.orderBy) ? opts.orderBy : [opts.orderBy]));
      if (opts.limit) q = q.limit(opts.limit);
      return q;
    },

    async first<T extends AnyTenantTable>(table: T, cond?: SQL): Promise<Row<T> | undefined> {
      const rows: Row<T>[] = await (db as any).select().from(table).where(where(table, cond)).limit(1);
      return rows[0];
    },

    async get<T extends AnyTenantTable>(table: T, cond: SQL, what = "row"): Promise<Row<T>> {
      const row = await api.first(table, cond);
      if (!row) throw new TenantNotFoundError(what);
      return row;
    },

    async insert<T extends AnyTenantTable>(table: T, values: NewRow<T>): Promise<Row<T>> {
      const rows: Row<T>[] = await (db as any)
        .insert(table)
        .values({ ...(values as object), workshopId })
        .returning();
      return rows[0] as Row<T>;
    },

    async insertMany<T extends AnyTenantTable>(table: T, values: NewRow<T>[]): Promise<Row<T>[]> {
      if (values.length === 0) return [];
      return (db as any)
        .insert(table)
        .values(values.map((v) => ({ ...(v as object), workshopId })))
        .returning();
    },

    /** Insert idempotente por (workshop_id, client_mutation_id): devolve a linha existente se já houver. */
    async insertIdempotent<T extends AnyTenantTable & { clientMutationId: PgColumn<any> }>(
      table: T,
      values: NewRow<T> & { clientMutationId: string },
    ): Promise<{ row: Row<T>; duplicate: boolean }> {
      const existing = await api.first(table, eq(table.clientMutationId, values.clientMutationId));
      if (existing) return { row: existing, duplicate: true };
      const rows: Row<T>[] = await (db as any)
        .insert(table)
        .values({ ...(values as object), workshopId })
        .onConflictDoNothing()
        .returning();
      if (rows[0]) return { row: rows[0], duplicate: false };
      const again = await api.get(table, eq(table.clientMutationId, values.clientMutationId));
      return { row: again, duplicate: true };
    },

    async update<T extends AnyTenantTable>(table: T, set: Partial<NewRow<T>>, cond: SQL): Promise<Row<T>[]> {
      const clean = { ...(set as object) } as Record<string, unknown>;
      delete clean.workshopId;
      return (db as any).update(table).set(clean).where(where(table, cond)).returning();
    },

    async delete<T extends AnyTenantTable>(table: T, cond: SQL): Promise<number> {
      const rows = await (db as any).delete(table).where(where(table, cond)).returning();
      return rows.length;
    },

    /**
     * Consultas com join/agregação. O callback recebe o db e o `scope`; TODA tabela
     * de negócio usada precisa entrar com scope(tabela) no where.
     */
    async query<R>(fn: (db: DB, s: Scope) => Promise<R>): Promise<R> {
      return fn(db, scope);
    },

    async transaction<R>(fn: (tx: TenantDb) => Promise<R>): Promise<R> {
      return (db as any).transaction(async (tx: DB) => fn(build(tx, workshopId)));
    },
  };
  return api;
}
/* eslint-enable @typescript-eslint/no-explicit-any */


export async function tenantDb(workshopId: string): Promise<TenantDb> {
  if (!/^[0-9a-f-]{36}$/i.test(workshopId)) throw new TenantNotFoundError("workshop");
  return build(await getDb(), workshopId);
}

/** Só para testes: monta o tenantDb sobre um db já criado. */
export function tenantDbFrom(db: DB, workshopId: string): TenantDb {
  return build(db, workshopId);
}
