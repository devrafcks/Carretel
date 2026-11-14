CREATE TABLE "access_audit_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"workshop_id" uuid,
	"user_id" text,
	"actor" text NOT NULL,
	"event" text NOT NULL,
	"ip" "inet",
	"source_port" integer,
	"user_agent" text,
	"resource" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "advances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workshop_id" uuid NOT NULL,
	"worker_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"given_on" date NOT NULL,
	"reason" text,
	"settlement_id" uuid,
	"client_mutation_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batch_operations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workshop_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"machine" text NOT NULL,
	"label" text,
	"piece_rate_cents" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workshop_id" uuid NOT NULL,
	"client_id" uuid,
	"reference" text,
	"quantity" integer NOT NULL,
	"size_grid" jsonb,
	"color" text,
	"unit_price_cents" integer NOT NULL,
	"total_cents" integer NOT NULL,
	"due_date" date,
	"supplies_by" text DEFAULT 'client' NOT NULL,
	"supplies_note" text,
	"status" text DEFAULT 'received' NOT NULL,
	"photo_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"client_mutation_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"workshop_id" uuid,
	"payload" jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workshop_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone_e164" text,
	"preferred_locale" text DEFAULT 'pt-BR' NOT NULL,
	"notes" text,
	"anonymized_at" timestamp with time zone,
	"client_mutation_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_proofs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workshop_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"previous_proof_id" uuid,
	"quantity" integer NOT NULL,
	"size_grid" jsonb,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"amount_cents" integer NOT NULL,
	"photo_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"note" text,
	"snapshot" jsonb NOT NULL,
	"content_sha256" text NOT NULL,
	"public_token" text NOT NULL,
	"viewed_at" timestamp with time zone,
	"viewed_ip" "inet",
	"confirmed_at" timestamp with time zone,
	"confirmed_name" text,
	"confirmed_ip" "inet",
	"confirmed_user_agent" text,
	"disputed_at" timestamp with time zone,
	"disputed_quantity" integer,
	"disputed_comment" text,
	"revoked_at" timestamp with time zone,
	"client_mutation_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dev_auth_codes" (
	"email" text PRIMARY KEY NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legal_acceptances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"workshop_id" uuid,
	"document" text NOT NULL,
	"version" text NOT NULL,
	"locale" text NOT NULL,
	"ip" "inet",
	"user_agent" text,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legal_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document" text NOT NULL,
	"version" text NOT NULL,
	"locale" text NOT NULL,
	"content_sha256" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legal_params" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value_cents" integer NOT NULL,
	"valid_from" date NOT NULL,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workshop_id" uuid NOT NULL,
	"storage" text DEFAULT 'db' NOT NULL,
	"storage_key" text NOT NULL,
	"data" "bytea",
	"mime" text NOT NULL,
	"bytes" integer NOT NULL,
	"width" integer,
	"height" integer,
	"exif_stripped" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offline_sync_queue" (
	"client_mutation_id" uuid PRIMARY KEY NOT NULL,
	"workshop_id" uuid NOT NULL,
	"user_id" text,
	"entity" text NOT NULL,
	"op" text NOT NULL,
	"server_entity_id" text,
	"status" text NOT NULL,
	"error" text,
	"client_created_at" timestamp with time zone,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workshop_id" uuid NOT NULL,
	"receivable_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"paid_on" date NOT NULL,
	"method" text DEFAULT 'pix' NOT NULL,
	"note" text,
	"client_mutation_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "production_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workshop_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"worker_id" uuid NOT NULL,
	"operation_id" uuid NOT NULL,
	"work_date" date NOT NULL,
	"pieces" integer NOT NULL,
	"hours" numeric(4, 1),
	"amount_cents" integer NOT NULL,
	"settlement_id" uuid,
	"client_mutation_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"key" text PRIMARY KEY NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receivables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workshop_id" uuid NOT NULL,
	"client_id" uuid,
	"delivery_proof_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"paid_cents" integer DEFAULT 0 NOT NULL,
	"issued_on" date NOT NULL,
	"due_on" date,
	"status" text DEFAULT 'awaiting_confirmation' NOT NULL,
	"payer_claimed_at" timestamp with time zone,
	"last_charged_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settlement_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workshop_id" uuid NOT NULL,
	"settlement_id" uuid NOT NULL,
	"production_log_id" uuid,
	"advance_id" uuid,
	"kind" text NOT NULL,
	"description" text,
	"pieces" integer,
	"amount_cents" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workshop_id" uuid NOT NULL,
	"worker_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"gross_cents" integer NOT NULL,
	"advances_cents" integer NOT NULL,
	"adjustments_cents" integer DEFAULT 0 NOT NULL,
	"net_cents" integer NOT NULL,
	"days_worked" integer NOT NULL,
	"below_min_wage_flag" boolean DEFAULT false NOT NULL,
	"excess_hours_flag" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'review' NOT NULL,
	"adjusts_settlement_id" uuid,
	"public_token" text NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workshop_id" uuid NOT NULL,
	"abacate_customer_id" text,
	"abacate_subscription_id" text,
	"abacate_checkout_id" text,
	"checkout_url" text,
	"external_id" text,
	"method" text,
	"status" text DEFAULT 'pending_checkout' NOT NULL,
	"first_charged_at" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"trial_ends_at" timestamp with time zone,
	"canceled_at" timestamp with time zone,
	"refund_requested_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workshop_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone_e164" text,
	"doc_type" text,
	"doc_number_enc" text,
	"doc_last3" text,
	"is_employee" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"anonymized_at" timestamp with time zone,
	"client_mutation_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workshop_members" (
	"workshop_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"email" text,
	"role" text DEFAULT 'owner' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workshop_members_workshop_id_user_id_pk" PRIMARY KEY("workshop_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "workshop_settings" (
	"workshop_id" uuid PRIMARY KEY NOT NULL,
	"calculator_profile" jsonb,
	"settlement_day" text DEFAULT 'saturday' NOT NULL,
	"settlement_period" text DEFAULT 'weekly' NOT NULL,
	"max_hours_per_day" numeric(4, 1),
	"default_operation_rates" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workshops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"city" text,
	"district" text,
	"machine_count" smallint DEFAULT 1 NOT NULL,
	"doc_type" text,
	"doc_number_enc" text,
	"doc_last3" text,
	"pix_key_type" text,
	"pix_key" text,
	"pix_merchant_name" text,
	"pix_city" text,
	"phone_e164" text,
	"default_locale" text DEFAULT 'es' NOT NULL,
	"plan_status" text DEFAULT 'free' NOT NULL,
	"free_batches_used" smallint DEFAULT 0 NOT NULL,
	"free_started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "advances" ADD CONSTRAINT "advances_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advances" ADD CONSTRAINT "advances_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_operations" ADD CONSTRAINT "batch_operations_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batch_operations" ADD CONSTRAINT "batch_operations_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batches" ADD CONSTRAINT "batches_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_proofs" ADD CONSTRAINT "delivery_proofs_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_proofs" ADD CONSTRAINT "delivery_proofs_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "legal_acceptances" ADD CONSTRAINT "legal_acceptances_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offline_sync_queue" ADD CONSTRAINT "offline_sync_queue_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_receivable_id_receivables_id_fk" FOREIGN KEY ("receivable_id") REFERENCES "public"."receivables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_logs" ADD CONSTRAINT "production_logs_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_logs" ADD CONSTRAINT "production_logs_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_logs" ADD CONSTRAINT "production_logs_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_logs" ADD CONSTRAINT "production_logs_operation_id_batch_operations_id_fk" FOREIGN KEY ("operation_id") REFERENCES "public"."batch_operations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receivables" ADD CONSTRAINT "receivables_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receivables" ADD CONSTRAINT "receivables_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receivables" ADD CONSTRAINT "receivables_delivery_proof_id_delivery_proofs_id_fk" FOREIGN KEY ("delivery_proof_id") REFERENCES "public"."delivery_proofs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_items" ADD CONSTRAINT "settlement_items_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_items" ADD CONSTRAINT "settlement_items_settlement_id_settlements_id_fk" FOREIGN KEY ("settlement_id") REFERENCES "public"."settlements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_items" ADD CONSTRAINT "settlement_items_production_log_id_production_logs_id_fk" FOREIGN KEY ("production_log_id") REFERENCES "public"."production_logs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlement_items" ADD CONSTRAINT "settlement_items_advance_id_advances_id_fk" FOREIGN KEY ("advance_id") REFERENCES "public"."advances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workers" ADD CONSTRAINT "workers_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workshop_members" ADD CONSTRAINT "workshop_members_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workshop_settings" ADD CONSTRAINT "workshop_settings_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "access_audit_logs_occurred_brin" ON "access_audit_logs" USING brin ("occurred_at");--> statement-breakpoint
CREATE INDEX "access_audit_logs_ws_occurred_idx" ON "access_audit_logs" USING btree ("workshop_id","occurred_at");--> statement-breakpoint
CREATE INDEX "advances_ws_worker_settlement_idx" ON "advances" USING btree ("workshop_id","worker_id","settlement_id");--> statement-breakpoint
CREATE UNIQUE INDEX "advances_ws_cmid_uq" ON "advances" USING btree ("workshop_id","client_mutation_id");--> statement-breakpoint
CREATE INDEX "batch_operations_ws_batch_idx" ON "batch_operations" USING btree ("workshop_id","batch_id");--> statement-breakpoint
CREATE INDEX "batches_ws_status_due_idx" ON "batches" USING btree ("workshop_id","status","due_date");--> statement-breakpoint
CREATE INDEX "batches_ws_client_idx" ON "batches" USING btree ("workshop_id","client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "batches_ws_cmid_uq" ON "batches" USING btree ("workshop_id","client_mutation_id");--> statement-breakpoint
CREATE INDEX "clients_ws_name_idx" ON "clients" USING btree ("workshop_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "clients_ws_cmid_uq" ON "clients" USING btree ("workshop_id","client_mutation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "delivery_proofs_public_token_uq" ON "delivery_proofs" USING btree ("public_token");--> statement-breakpoint
CREATE INDEX "delivery_proofs_ws_batch_version_idx" ON "delivery_proofs" USING btree ("workshop_id","batch_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "delivery_proofs_ws_cmid_uq" ON "delivery_proofs" USING btree ("workshop_id","client_mutation_id");--> statement-breakpoint
CREATE INDEX "legal_acceptances_user_idx" ON "legal_acceptances" USING btree ("user_id","document");--> statement-breakpoint
CREATE UNIQUE INDEX "legal_documents_doc_ver_locale_uq" ON "legal_documents" USING btree ("document","version","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "legal_params_key_valid_uq" ON "legal_params" USING btree ("key","valid_from");--> statement-breakpoint
CREATE INDEX "media_assets_ws_idx" ON "media_assets" USING btree ("workshop_id","created_at");--> statement-breakpoint
CREATE INDEX "offline_sync_queue_ws_received_idx" ON "offline_sync_queue" USING btree ("workshop_id","received_at");--> statement-breakpoint
CREATE INDEX "payments_ws_receivable_idx" ON "payments" USING btree ("workshop_id","receivable_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_ws_cmid_uq" ON "payments" USING btree ("workshop_id","client_mutation_id");--> statement-breakpoint
CREATE INDEX "production_logs_ws_worker_date_idx" ON "production_logs" USING btree ("workshop_id","worker_id","work_date");--> statement-breakpoint
CREATE INDEX "production_logs_ws_batch_idx" ON "production_logs" USING btree ("workshop_id","batch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "production_logs_ws_cmid_uq" ON "production_logs" USING btree ("workshop_id","client_mutation_id");--> statement-breakpoint
CREATE INDEX "receivables_ws_status_issued_idx" ON "receivables" USING btree ("workshop_id","status","issued_on");--> statement-breakpoint
CREATE UNIQUE INDEX "receivables_proof_uq" ON "receivables" USING btree ("delivery_proof_id");--> statement-breakpoint
CREATE INDEX "settlement_items_ws_settlement_idx" ON "settlement_items" USING btree ("workshop_id","settlement_id");--> statement-breakpoint
CREATE INDEX "settlements_ws_worker_period_idx" ON "settlements" USING btree ("workshop_id","worker_id","period_end");--> statement-breakpoint
CREATE UNIQUE INDEX "settlements_public_token_uq" ON "settlements" USING btree ("public_token");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_ws_uq" ON "subscriptions" USING btree ("workshop_id");--> statement-breakpoint
CREATE INDEX "subscriptions_abacate_sub_idx" ON "subscriptions" USING btree ("abacate_subscription_id");--> statement-breakpoint
CREATE INDEX "workers_ws_active_idx" ON "workers" USING btree ("workshop_id","active");--> statement-breakpoint
CREATE UNIQUE INDEX "workers_ws_cmid_uq" ON "workers" USING btree ("workshop_id","client_mutation_id");--> statement-breakpoint
CREATE INDEX "workshop_members_user_idx" ON "workshop_members" USING btree ("user_id");