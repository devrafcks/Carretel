CREATE TABLE "error_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"ref" text NOT NULL,
	"fingerprint" text NOT NULL,
	"level" text DEFAULT 'error' NOT NULL,
	"source" text NOT NULL,
	"event" text NOT NULL,
	"message" text,
	"stack" text,
	"digest" text,
	"path" text,
	"method" text,
	"user_id" text,
	"workshop_id" uuid,
	"user_agent" text,
	"context" jsonb,
	"resolved_at" timestamp with time zone,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "error_logs_occurred_idx" ON "error_logs" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "error_logs_fingerprint_idx" ON "error_logs" USING btree ("fingerprint","occurred_at");--> statement-breakpoint
CREATE INDEX "error_logs_ref_idx" ON "error_logs" USING btree ("ref");--> statement-breakpoint
CREATE INDEX "error_logs_digest_idx" ON "error_logs" USING btree ("digest");--> statement-breakpoint
-- Supabase: a API pública não enxerga a tabela nova (mesma regra da 0009).
ALTER TABLE "error_logs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN REVOKE ALL ON "error_logs" FROM anon, authenticated; REVOKE ALL ON SEQUENCE "error_logs_id_seq" FROM anon, authenticated; END IF; END $$;
