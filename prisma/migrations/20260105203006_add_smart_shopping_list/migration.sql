-- CreateTable
CREATE TABLE "ShoppingListWeek" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingListWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingListSmart" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingListSmart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingListSmartItem" (
    "id" TEXT NOT NULL,
    "smartListId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "displayText" TEXT NOT NULL,
    "quantityValue" DECIMAL(65,30),
    "quantityUnit" TEXT,
    "isEstimated" BOOLEAN NOT NULL DEFAULT false,
    "isMerged" BOOLEAN NOT NULL DEFAULT false,
    "sortKey" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ShoppingListSmartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingListSmartProvenance" (
    "id" TEXT NOT NULL,
    "smartItemId" TEXT NOT NULL,
    "sourceRecipeId" TEXT,
    "sourceText" TEXT NOT NULL,
    "sourceCount" INTEGER,
    "notes" TEXT,

    CONSTRAINT "ShoppingListSmartProvenance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingListWeek_workspaceId_weekStart_key" ON "ShoppingListWeek"("workspaceId", "weekStart");

-- CreateIndex
CREATE INDEX "ShoppingListWeek_workspaceId_weekStart_idx" ON "ShoppingListWeek"("workspaceId", "weekStart");

-- CreateIndex
CREATE INDEX "ShoppingListSmart_workspaceId_weekId_idx" ON "ShoppingListSmart"("workspaceId", "weekId");

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingListSmart_workspaceId_weekId_version_key" ON "ShoppingListSmart"("workspaceId", "weekId", "version");

-- AddForeignKey
ALTER TABLE "ShoppingListWeek" ADD CONSTRAINT "ShoppingListWeek_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListSmart" ADD CONSTRAINT "ShoppingListSmart_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListSmart" ADD CONSTRAINT "ShoppingListSmart_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "ShoppingListWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListSmartItem" ADD CONSTRAINT "ShoppingListSmartItem_smartListId_fkey" FOREIGN KEY ("smartListId") REFERENCES "ShoppingListSmart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListSmartProvenance" ADD CONSTRAINT "ShoppingListSmartProvenance_smartItemId_fkey" FOREIGN KEY ("smartItemId") REFERENCES "ShoppingListSmartItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
