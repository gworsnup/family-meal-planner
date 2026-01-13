-- CreateEnum
CREATE TYPE "SmartListJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "SmartListJob" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "shoppingListId" TEXT NOT NULL,
    "shoppingListName" TEXT NOT NULL,
    "smartListId" TEXT,
    "status" "SmartListJobStatus" NOT NULL DEFAULT 'QUEUED',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "notifiedAt" TIMESTAMP(3),

    CONSTRAINT "SmartListJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SmartListJob_workspaceId_updatedAt_idx" ON "SmartListJob"("workspaceId", "updatedAt");

-- CreateIndex
CREATE INDEX "SmartListJob_weekId_idx" ON "SmartListJob"("weekId");

-- CreateIndex
CREATE INDEX "SmartListJob_status_idx" ON "SmartListJob"("status");

-- AddForeignKey
ALTER TABLE "SmartListJob" ADD CONSTRAINT "SmartListJob_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmartListJob" ADD CONSTRAINT "SmartListJob_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "ShoppingListWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;
