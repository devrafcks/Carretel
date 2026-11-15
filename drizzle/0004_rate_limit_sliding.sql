ALTER TABLE "rate_limits" ADD COLUMN "prev_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "rate_limits_window_idx" ON "rate_limits" USING btree ("window_start");