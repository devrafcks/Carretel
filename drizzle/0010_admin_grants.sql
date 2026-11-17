ALTER TABLE "subscriptions" ADD COLUMN "refund_resolved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "granted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "grant_note" text;--> statement-breakpoint
ALTER TABLE "workshops" ADD COLUMN "admin_note" text;