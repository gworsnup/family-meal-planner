-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN "isDraft" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "RecipeImport" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipeImport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecipeImport_recipeId_key" ON "RecipeImport"("recipeId");

-- CreateIndex
CREATE INDEX "RecipeImport_workspaceId_idx" ON "RecipeImport"("workspaceId");

-- CreateIndex
CREATE INDEX "RecipeImport_status_idx" ON "RecipeImport"("status");

-- AddForeignKey
ALTER TABLE "RecipeImport" ADD CONSTRAINT "RecipeImport_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeImport" ADD CONSTRAINT "RecipeImport_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
