-- CreateEnum
CREATE TYPE "PlanItemType" AS ENUM ('RECIPE', 'TAKEAWAY');

-- AlterTable
ALTER TABLE "MealPlanItem" RENAME COLUMN "note" TO "notes";

ALTER TABLE "MealPlanItem"
ADD COLUMN     "type" "PlanItemType" NOT NULL DEFAULT 'RECIPE',
ADD COLUMN     "title" TEXT,
ADD COLUMN     "sortOrder" INTEGER,
ALTER COLUMN "recipeId" DROP NOT NULL;
