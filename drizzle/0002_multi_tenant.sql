ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "tenant_id" text;
UPDATE "assets" SET "tenant_id" = "owner_email" WHERE "tenant_id" IS NULL;
ALTER TABLE "assets" ALTER COLUMN "tenant_id" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "assets_tenant_idx" ON "assets" ("tenant_id");
