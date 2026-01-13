"use server";

import "server-only";

import { requireWorkspaceUser } from "@/lib/auth";
import { generateSmartListForWorkspace } from "@/lib/smartListGenerator";

export async function generateSmartList({
  slug,
  weekId,
}: {
  slug: string;
  weekId: string;
}) {
  const user = await requireWorkspaceUser(slug);

  return generateSmartListForWorkspace({
    workspaceId: user.workspace.id,
    workspaceSlug: user.workspace.slug,
    weekId,
  });
}
