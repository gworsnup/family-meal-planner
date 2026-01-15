-- Add normalized tags + timestamps
ALTER TABLE "Tag" ADD COLUMN "nameNormalized" TEXT;
ALTER TABLE "Tag" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Tag" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Tag"
SET "nameNormalized" = LOWER(TRIM(REGEXP_REPLACE("name", '\\s+', ' ', 'g')))
WHERE "nameNormalized" IS NULL;

ALTER TABLE "Tag" ALTER COLUMN "nameNormalized" SET NOT NULL;

DROP INDEX IF EXISTS "Tag_workspaceId_name_key";
CREATE UNIQUE INDEX "Tag_workspaceId_nameNormalized_key" ON "Tag"("workspaceId", "nameNormalized");
CREATE INDEX "Tag_workspaceId_idx" ON "Tag"("workspaceId");
