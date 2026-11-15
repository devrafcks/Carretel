ALTER TABLE "subscriptions" ADD COLUMN "price_tier" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "billing_cycle" text DEFAULT 'monthly' NOT NULL;--> statement-breakpoint
-- quem já pagou ou começou o teste antes da mudança de preço entrou a R$ 35: fica como fundador para sempre
UPDATE "subscriptions" SET "price_tier" = 'founder'
WHERE "price_tier" IS NULL
  AND ("first_charged_at" IS NOT NULL OR "trial_ends_at" IS NOT NULL OR "abacate_subscription_id" IS NOT NULL);
