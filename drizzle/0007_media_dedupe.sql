ALTER TABLE "media_assets" ADD COLUMN "sha256" text;--> statement-breakpoint
CREATE INDEX "media_assets_ws_sha_idx" ON "media_assets" USING btree ("workshop_id","sha256");--> statement-breakpoint
-- fotos já chegam comprimidas (WebP/JPEG): sem tentativa de recomprimir no TOAST, fica fora da linha direto
ALTER TABLE "media_assets" ALTER COLUMN "data" SET STORAGE EXTERNAL;
