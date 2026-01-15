import "server-only";

import { prisma } from "@/lib/db";
import { DEFAULT_WORKSPACE_TAGS } from "@/lib/defaultTags";
import { normalizeTagName } from "@/lib/normalizeTagName";

export async function seedDefaultTagsForWorkspace(workspaceId: string) {
  if (!workspaceId) return;

  await prisma.tag.createMany({
    data: DEFAULT_WORKSPACE_TAGS.map((name) => ({
      workspaceId,
      name,
      nameNormalized: normalizeTagName(name),
    })),
    skipDuplicates: true,
  });
}
