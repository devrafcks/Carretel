/**
 * Tabelas do login (Better Auth) no schema app_auth. Criadas pela migração 0009_app_auth.sql
 * (fora do schema.ts de propósito: o drizzle-kit não deve gerar migrações para elas).
 * Nomes de coluna em camelCase, como o Better Auth espera.
 */
import { boolean, index, pgSchema, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const appAuth = pgSchema("app_auth");

const ts = (name: string) => timestamp(name, { withTimezone: true });

export const user = appAuth.table("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: ts("createdAt").notNull().defaultNow(),
  updatedAt: ts("updatedAt").notNull().defaultNow(),
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("banReason"),
  banExpires: ts("banExpires"),
});

export const session = appAuth.table(
  "session",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    expiresAt: ts("expiresAt").notNull(),
    token: text("token").notNull().unique(),
    createdAt: ts("createdAt").notNull().defaultNow(),
    updatedAt: ts("updatedAt").notNull().defaultNow(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonatedBy"),
  },
  (t) => [index("app_auth_session_user_idx").on(t.userId)],
);

export const account = appAuth.table(
  "account",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: ts("accessTokenExpiresAt"),
    refreshTokenExpiresAt: ts("refreshTokenExpiresAt"),
    scope: text("scope"),
    password: text("password"),
    createdAt: ts("createdAt").notNull().defaultNow(),
    updatedAt: ts("updatedAt").notNull().defaultNow(),
  },
  (t) => [index("app_auth_account_user_idx").on(t.userId)],
);

export const verification = appAuth.table(
  "verification",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: ts("expiresAt").notNull(),
    createdAt: ts("createdAt").notNull().defaultNow(),
    updatedAt: ts("updatedAt").notNull().defaultNow(),
  },
  (t) => [index("app_auth_verification_identifier_idx").on(t.identifier)],
);
