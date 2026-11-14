import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  integer,
  smallint,
  boolean,
  jsonb,
  date,
  timestamp,
  numeric,
  bigserial,
  inet,
  index,
  uniqueIndex,
  primaryKey,
  customType,
} from "drizzle-orm/pg-core";

/* Tipos auxiliares */
const ts = (name: string) => timestamp(name, { withTimezone: true, mode: "date" });
const createdAt = () => ts("created_at").notNull().defaultNow();
const updatedAt = () => ts("updated_at").notNull().defaultNow();
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

export type SizeGrid = Record<string, number>;
export type PlanStatus = "free" | "pending_checkout" | "trialing" | "active" | "past_due" | "canceled" | "read_only";

/* ─────────────── 1. Oficina e acesso ─────────────── */
/* Usuários e sessões vivem no Neon Auth (schema neon_auth). user_id aqui é o id do Better Auth gerenciado. */

export const workshops = pgTable("workshops", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  city: text("city"),
  district: text("district"),
  machineCount: smallint("machine_count").notNull().default(1),
  docType: text("doc_type", { enum: ["cpf", "rnm", "cnpj"] }),
  docNumberEnc: text("doc_number_enc"),
  docLast3: text("doc_last3"),
  pixKeyType: text("pix_key_type", { enum: ["evp", "phone", "email", "cpf", "cnpj"] }),
  pixKey: text("pix_key"),
  pixMerchantName: text("pix_merchant_name"),
  pixCity: text("pix_city"),
  phoneE164: text("phone_e164"),
  defaultLocale: text("default_locale", { enum: ["es", "pt-BR"] }).notNull().default("es"),
  planStatus: text("plan_status", {
    enum: ["free", "pending_checkout", "trialing", "active", "past_due", "canceled", "read_only"],
  })
    .notNull()
    .default("free"),
  freeBatchesUsed: smallint("free_batches_used").notNull().default(0),
  freeStartedAt: ts("free_started_at").notNull().defaultNow(),
  deletedAt: ts("deleted_at"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const workshopMembers = pgTable(
  "workshop_members",
  {
    workshopId: uuid("workshop_id")
      .notNull()
      .references(() => workshops.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    email: text("email"),
    role: text("role", { enum: ["owner", "helper"] }).notNull().default("owner"),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.workshopId, t.userId] }), index("workshop_members_user_idx").on(t.userId)],
);

export interface CalculatorProfile {
  fixedMonthlyCents: number;
  payrollMonthlyCents: number;
  people: number;
  hoursPerDay: number;
  daysPerMonth: number;
  marginPct: number;
}

export const workshopSettings = pgTable("workshop_settings", {
  workshopId: uuid("workshop_id")
    .primaryKey()
    .references(() => workshops.id, { onDelete: "cascade" }),
  calculatorProfile: jsonb("calculator_profile").$type<CalculatorProfile>(),
  settlementDay: text("settlement_day").notNull().default("saturday"),
  settlementPeriod: text("settlement_period", { enum: ["weekly", "biweekly"] }).notNull().default("weekly"),
  maxHoursPerDay: numeric("max_hours_per_day", { precision: 4, scale: 1 }),
  defaultOperationRates: jsonb("default_operation_rates").$type<Record<string, number>>(),
  updatedAt: updatedAt(),
});

/* ─────────────── 2. Contratantes ─────────────── */
export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workshopId: uuid("workshop_id")
      .notNull()
      .references(() => workshops.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phoneE164: text("phone_e164"),
    preferredLocale: text("preferred_locale", { enum: ["es", "pt-BR"] }).notNull().default("pt-BR"),
    notes: text("notes"),
    anonymizedAt: ts("anonymized_at"),
    clientMutationId: uuid("client_mutation_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("clients_ws_name_idx").on(t.workshopId, t.name),
    uniqueIndex("clients_ws_cmid_uq").on(t.workshopId, t.clientMutationId),
  ],
);

/* ─────────────── 3. Equipe ─────────────── */
export const workers = pgTable(
  "workers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workshopId: uuid("workshop_id")
      .notNull()
      .references(() => workshops.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    phoneE164: text("phone_e164"),
    docType: text("doc_type", { enum: ["cpf", "rnm"] }),
    docNumberEnc: text("doc_number_enc"),
    docLast3: text("doc_last3"),
    isEmployee: boolean("is_employee").notNull().default(false),
    active: boolean("active").notNull().default(true),
    anonymizedAt: ts("anonymized_at"),
    clientMutationId: uuid("client_mutation_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("workers_ws_active_idx").on(t.workshopId, t.active),
    uniqueIndex("workers_ws_cmid_uq").on(t.workshopId, t.clientMutationId),
  ],
);

/* ─────────────── 4. Lotes ─────────────── */
export const BATCH_STATUS = ["received", "in_production", "ready", "delivered", "closed", "canceled"] as const;
export type BatchStatus = (typeof BATCH_STATUS)[number];

export const batches = pgTable(
  "batches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workshopId: uuid("workshop_id")
      .notNull()
      .references(() => workshops.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id),
    reference: text("reference"),
    quantity: integer("quantity").notNull(),
    sizeGrid: jsonb("size_grid").$type<SizeGrid>(),
    color: text("color"),
    unitPriceCents: integer("unit_price_cents").notNull(),
    totalCents: integer("total_cents").notNull(),
    dueDate: date("due_date"),
    suppliesBy: text("supplies_by", { enum: ["client", "workshop"] }).notNull().default("client"),
    suppliesNote: text("supplies_note"),
    status: text("status", { enum: BATCH_STATUS }).notNull().default("received"),
    photoIds: uuid("photo_ids").array().notNull().default(sql`'{}'::uuid[]`),
    version: integer("version").notNull().default(1),
    clientMutationId: uuid("client_mutation_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("batches_ws_status_due_idx").on(t.workshopId, t.status, t.dueDate),
    index("batches_ws_client_idx").on(t.workshopId, t.clientId),
    uniqueIndex("batches_ws_cmid_uq").on(t.workshopId, t.clientMutationId),
  ],
);

export const MACHINES = ["recta", "overlock", "collareta", "interlock", "other"] as const;
export type Machine = (typeof MACHINES)[number];

export const batchOperations = pgTable(
  "batch_operations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workshopId: uuid("workshop_id")
      .notNull()
      .references(() => workshops.id, { onDelete: "cascade" }),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => batches.id, { onDelete: "cascade" }),
    machine: text("machine", { enum: MACHINES }).notNull(),
    label: text("label"),
    pieceRateCents: integer("piece_rate_cents").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("batch_operations_ws_batch_idx").on(t.workshopId, t.batchId)],
);

/* ─────────────── 5. Produção ─────────────── */
export const productionLogs = pgTable(
  "production_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workshopId: uuid("workshop_id")
      .notNull()
      .references(() => workshops.id, { onDelete: "cascade" }),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => batches.id),
    workerId: uuid("worker_id")
      .notNull()
      .references(() => workers.id),
    operationId: uuid("operation_id")
      .notNull()
      .references(() => batchOperations.id),
    workDate: date("work_date").notNull(),
    pieces: integer("pieces").notNull(),
    hours: numeric("hours", { precision: 4, scale: 1 }),
    amountCents: integer("amount_cents").notNull(),
    settlementId: uuid("settlement_id"),
    clientMutationId: uuid("client_mutation_id"),
    createdAt: createdAt(),
  },
  (t) => [
    index("production_logs_ws_worker_date_idx").on(t.workshopId, t.workerId, t.workDate),
    index("production_logs_ws_batch_idx").on(t.workshopId, t.batchId),
    uniqueIndex("production_logs_ws_cmid_uq").on(t.workshopId, t.clientMutationId),
  ],
);

/* ─────────────── 6. Adelantos ─────────────── */
export const advances = pgTable(
  "advances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workshopId: uuid("workshop_id")
      .notNull()
      .references(() => workshops.id, { onDelete: "cascade" }),
    workerId: uuid("worker_id")
      .notNull()
      .references(() => workers.id),
    amountCents: integer("amount_cents").notNull(),
    givenOn: date("given_on").notNull(),
    reason: text("reason"),
    settlementId: uuid("settlement_id"),
    clientMutationId: uuid("client_mutation_id"),
    createdAt: createdAt(),
  },
  (t) => [
    index("advances_ws_worker_settlement_idx").on(t.workshopId, t.workerId, t.settlementId),
    uniqueIndex("advances_ws_cmid_uq").on(t.workshopId, t.clientMutationId),
  ],
);

/* ─────────────── 7. Acerto ─────────────── */
export const settlements = pgTable(
  "settlements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workshopId: uuid("workshop_id")
      .notNull()
      .references(() => workshops.id, { onDelete: "cascade" }),
    workerId: uuid("worker_id")
      .notNull()
      .references(() => workers.id),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    grossCents: integer("gross_cents").notNull(),
    advancesCents: integer("advances_cents").notNull(),
    adjustmentsCents: integer("adjustments_cents").notNull().default(0),
    netCents: integer("net_cents").notNull(),
    daysWorked: integer("days_worked").notNull(),
    belowMinWageFlag: boolean("below_min_wage_flag").notNull().default(false),
    excessHoursFlag: boolean("excess_hours_flag").notNull().default(false),
    status: text("status", { enum: ["draft", "review", "paid"] }).notNull().default("review"),
    adjustsSettlementId: uuid("adjusts_settlement_id"),
    publicToken: text("public_token").notNull(),
    paidAt: ts("paid_at"),
    createdAt: createdAt(),
  },
  (t) => [
    index("settlements_ws_worker_period_idx").on(t.workshopId, t.workerId, t.periodEnd),
    uniqueIndex("settlements_public_token_uq").on(t.publicToken),
  ],
);

export const settlementItems = pgTable(
  "settlement_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workshopId: uuid("workshop_id")
      .notNull()
      .references(() => workshops.id, { onDelete: "cascade" }),
    settlementId: uuid("settlement_id")
      .notNull()
      .references(() => settlements.id, { onDelete: "cascade" }),
    productionLogId: uuid("production_log_id").references(() => productionLogs.id),
    advanceId: uuid("advance_id").references(() => advances.id),
    kind: text("kind", { enum: ["production", "advance", "adjustment"] }).notNull(),
    description: text("description"),
    pieces: integer("pieces"),
    amountCents: integer("amount_cents").notNull(),
  },
  (t) => [index("settlement_items_ws_settlement_idx").on(t.workshopId, t.settlementId)],
);

/* ─────────────── 8. Prova de entrega ─────────────── */
export interface ProofSnapshot {
  v: 1;
  workshop: { name: string; city: string | null };
  client: { name: string };
  batch: { reference: string | null; color: string | null; unitPriceCents: number; dueDate: string | null };
  delivery: {
    quantity: number;
    sizeGrid: SizeGrid | null;
    discountCents: number;
    amountCents: number;
    note: string | null;
    deliveredAt: string;
    version: number;
  };
  photoIds: string[];
}

export const deliveryProofs = pgTable(
  "delivery_proofs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workshopId: uuid("workshop_id")
      .notNull()
      .references(() => workshops.id, { onDelete: "cascade" }),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => batches.id),
    version: integer("version").notNull().default(1),
    previousProofId: uuid("previous_proof_id"),
    quantity: integer("quantity").notNull(),
    sizeGrid: jsonb("size_grid").$type<SizeGrid>(),
    discountCents: integer("discount_cents").notNull().default(0),
    amountCents: integer("amount_cents").notNull(),
    photoIds: uuid("photo_ids").array().notNull().default(sql`'{}'::uuid[]`),
    note: text("note"),
    snapshot: jsonb("snapshot").$type<ProofSnapshot>().notNull(),
    contentSha256: text("content_sha256").notNull(),
    publicToken: text("public_token").notNull(),
    viewedAt: ts("viewed_at"),
    viewedIp: inet("viewed_ip"),
    confirmedAt: ts("confirmed_at"),
    confirmedName: text("confirmed_name"),
    confirmedIp: inet("confirmed_ip"),
    confirmedUserAgent: text("confirmed_user_agent"),
    disputedAt: ts("disputed_at"),
    disputedQuantity: integer("disputed_quantity"),
    disputedComment: text("disputed_comment"),
    revokedAt: ts("revoked_at"),
    clientMutationId: uuid("client_mutation_id"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("delivery_proofs_public_token_uq").on(t.publicToken),
    index("delivery_proofs_ws_batch_version_idx").on(t.workshopId, t.batchId, t.version),
    uniqueIndex("delivery_proofs_ws_cmid_uq").on(t.workshopId, t.clientMutationId),
  ],
);

/* ─────────────── 9. Recebíveis ─────────────── */
export const RECEIVABLE_STATUS = [
  "awaiting_confirmation",
  "open",
  "disputed",
  "partially_paid",
  "paid",
  "written_off",
] as const;
export type ReceivableStatus = (typeof RECEIVABLE_STATUS)[number];

export const receivables = pgTable(
  "receivables",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workshopId: uuid("workshop_id")
      .notNull()
      .references(() => workshops.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id),
    deliveryProofId: uuid("delivery_proof_id")
      .notNull()
      .references(() => deliveryProofs.id),
    amountCents: integer("amount_cents").notNull(),
    paidCents: integer("paid_cents").notNull().default(0),
    issuedOn: date("issued_on").notNull(),
    dueOn: date("due_on"),
    status: text("status", { enum: RECEIVABLE_STATUS }).notNull().default("awaiting_confirmation"),
    payerClaimedAt: ts("payer_claimed_at"),
    lastChargedAt: ts("last_charged_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("receivables_ws_status_issued_idx").on(t.workshopId, t.status, t.issuedOn),
    uniqueIndex("receivables_proof_uq").on(t.deliveryProofId),
  ],
);

/* ─────────────── 10. Pagamentos recebidos ─────────────── */
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workshopId: uuid("workshop_id")
      .notNull()
      .references(() => workshops.id, { onDelete: "cascade" }),
    receivableId: uuid("receivable_id")
      .notNull()
      .references(() => receivables.id),
    amountCents: integer("amount_cents").notNull(),
    paidOn: date("paid_on").notNull(),
    method: text("method", { enum: ["pix", "cash", "other"] }).notNull().default("pix"),
    note: text("note"),
    clientMutationId: uuid("client_mutation_id"),
    createdAt: createdAt(),
  },
  (t) => [
    index("payments_ws_receivable_idx").on(t.workshopId, t.receivableId),
    uniqueIndex("payments_ws_cmid_uq").on(t.workshopId, t.clientMutationId),
  ],
);

/* ─────────────── 11. Assinatura SaaS ─────────────── */
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workshopId: uuid("workshop_id")
      .notNull()
      .references(() => workshops.id, { onDelete: "cascade" }),
    abacateCustomerId: text("abacate_customer_id"),
    abacateSubscriptionId: text("abacate_subscription_id"),
    abacateCheckoutId: text("abacate_checkout_id"),
    checkoutUrl: text("checkout_url"),
    externalId: text("external_id"),
    method: text("method", { enum: ["PIX", "CARD"] }),
    status: text("status").notNull().default("pending_checkout"),
    firstChargedAt: ts("first_charged_at"),
    currentPeriodEnd: ts("current_period_end"),
    trialEndsAt: ts("trial_ends_at"),
    canceledAt: ts("canceled_at"),
    refundRequestedAt: ts("refund_requested_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("subscriptions_ws_uq").on(t.workshopId), index("subscriptions_abacate_sub_idx").on(t.abacateSubscriptionId)],
);

export const billingWebhookEvents = pgTable("billing_webhook_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  workshopId: uuid("workshop_id"),
  payload: jsonb("payload").notNull(),
  receivedAt: ts("received_at").notNull().defaultNow(),
  processedAt: ts("processed_at"),
  error: text("error"),
});

/* ─────────────── 12. Logs Marco Civil ─────────────── */
export const accessAuditLogs = pgTable(
  "access_audit_logs",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    workshopId: uuid("workshop_id"),
    userId: text("user_id"),
    actor: text("actor", { enum: ["user", "public", "system"] }).notNull(),
    event: text("event").notNull(),
    ip: inet("ip"),
    sourcePort: integer("source_port"),
    userAgent: text("user_agent"),
    resource: text("resource"),
    occurredAt: ts("occurred_at").notNull().defaultNow(),
  },
  (t) => [
    index("access_audit_logs_occurred_brin").using("brin", t.occurredAt),
    index("access_audit_logs_ws_occurred_idx").on(t.workshopId, t.occurredAt),
  ],
);

/* ─────────────── 13. Offline e mídia ─────────────── */
export const offlineSyncQueue = pgTable(
  "offline_sync_queue",
  {
    clientMutationId: uuid("client_mutation_id").primaryKey(),
    workshopId: uuid("workshop_id")
      .notNull()
      .references(() => workshops.id, { onDelete: "cascade" }),
    userId: text("user_id"),
    entity: text("entity").notNull(),
    op: text("op", { enum: ["create", "update", "delete"] }).notNull(),
    serverEntityId: text("server_entity_id"),
    status: text("status", { enum: ["applied", "duplicate", "rejected"] }).notNull(),
    error: text("error"),
    clientCreatedAt: ts("client_created_at"),
    receivedAt: ts("received_at").notNull().defaultNow(),
  },
  (t) => [index("offline_sync_queue_ws_received_idx").on(t.workshopId, t.receivedAt)],
);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workshopId: uuid("workshop_id")
      .notNull()
      .references(() => workshops.id, { onDelete: "cascade" }),
    storage: text("storage", { enum: ["vercel-blob", "db"] }).notNull().default("db"),
    storageKey: text("storage_key").notNull(),
    data: bytea("data"),
    mime: text("mime").notNull(),
    bytes: integer("bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    exifStripped: boolean("exif_stripped").notNull().default(false),
    deletedAt: ts("deleted_at"),
    createdAt: createdAt(),
  },
  (t) => [index("media_assets_ws_idx").on(t.workshopId, t.createdAt)],
);

/* ─────────────── 14. Legal ─────────────── */
export const legalDocuments = pgTable(
  "legal_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    document: text("document", { enum: ["terms", "privacy", "no_forced_labor", "dpa"] }).notNull(),
    version: text("version").notNull(),
    locale: text("locale", { enum: ["es", "pt-BR"] }).notNull(),
    contentSha256: text("content_sha256"),
    status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
    publishedAt: ts("published_at"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("legal_documents_doc_ver_locale_uq").on(t.document, t.version, t.locale)],
);

export const legalAcceptances = pgTable(
  "legal_acceptances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(),
    workshopId: uuid("workshop_id").references(() => workshops.id, { onDelete: "set null" }),
    document: text("document", { enum: ["terms", "privacy", "no_forced_labor", "dpa"] }).notNull(),
    version: text("version").notNull(),
    locale: text("locale").notNull(),
    ip: inet("ip"),
    userAgent: text("user_agent"),
    acceptedAt: ts("accepted_at").notNull().defaultNow(),
  },
  (t) => [index("legal_acceptances_user_idx").on(t.userId, t.document)],
);

export const legalParams = pgTable(
  "legal_params",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull(),
    valueCents: integer("value_cents").notNull(),
    validFrom: date("valid_from").notNull(),
    source: text("source"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("legal_params_key_valid_uq").on(t.key, t.validFrom)],
);

/* Rate limit simples por chave (link público, OTP, sync) */
export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: ts("window_start").notNull(),
  count: integer("count").notNull().default(0),
});

/* Sessões do modo de desenvolvimento (só quando NEON_AUTH_BASE_URL não está configurado) */
export const devAuthCodes = pgTable("dev_auth_codes", {
  email: text("email").primaryKey(),
  codeHash: text("code_hash").notNull(),
  expiresAt: ts("expires_at").notNull(),
  attempts: integer("attempts").notNull().default(0),
});
