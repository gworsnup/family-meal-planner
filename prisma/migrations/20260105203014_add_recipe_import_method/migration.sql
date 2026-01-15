-- Add import method for recipe imports
ALTER TABLE "RecipeImport"
ADD COLUMN "importMethod" TEXT NOT NULL DEFAULT 'fetch';
