CREATE TABLE "ShortcutImportToken" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ShortcutImportToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShortcutImportToken_tokenHash_key" ON "ShortcutImportToken"("tokenHash");
CREATE INDEX "ShortcutImportToken_workspaceId_revokedAt_idx" ON "ShortcutImportToken"("workspaceId", "revokedAt");

ALTER TABLE "ShortcutImportToken"
ADD CONSTRAINT "ShortcutImportToken_workspaceId_fkey"
FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
