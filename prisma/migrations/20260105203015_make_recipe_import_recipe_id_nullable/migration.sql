-- Allow recipe imports without a recipe until validation passes
ALTER TABLE "RecipeImport" ALTER COLUMN "recipeId" DROP NOT NULL;
