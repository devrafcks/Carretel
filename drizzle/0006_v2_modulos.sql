CREATE TABLE "outsource_returns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workshop_id" uuid NOT NULL,
	"shipment_id" uuid NOT NULL,
	"returned_on" date NOT NULL,
	"good_qty" integer DEFAULT 0 NOT NULL,
	"defect_qty" integer DEFAULT 0 NOT NULL,
	"missing_qty" integer DEFAULT 0 NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outsource_shipments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workshop_id" uuid NOT NULL,
	"batch_id" uuid,
	"partner_name" text NOT NULL,
	"partner_phone_e164" text,
	"reference" text,
	"quantity" integer NOT NULL,
	"sent_on" date NOT NULL,
	"due_on" date,
	"status" text DEFAULT 'sent' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "worker_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workshop_id" uuid NOT NULL,
	"worker_id" uuid NOT NULL,
	"machine" text,
	"reference" text,
	"piece_rate_cents" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "usual_reference" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "usual_unit_price_cents" integer;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "founder_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "outsource_returns" ADD CONSTRAINT "outsource_returns_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outsource_returns" ADD CONSTRAINT "outsource_returns_shipment_id_outsource_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."outsource_shipments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outsource_shipments" ADD CONSTRAINT "outsource_shipments_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outsource_shipments" ADD CONSTRAINT "outsource_shipments_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_rates" ADD CONSTRAINT "worker_rates_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_rates" ADD CONSTRAINT "worker_rates_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "outsource_returns_ws_shipment_idx" ON "outsource_returns" USING btree ("workshop_id","shipment_id");--> statement-breakpoint
CREATE INDEX "outsource_shipments_ws_status_idx" ON "outsource_shipments" USING btree ("workshop_id","status");--> statement-breakpoint
CREATE INDEX "worker_rates_ws_worker_idx" ON "worker_rates" USING btree ("workshop_id","worker_id");