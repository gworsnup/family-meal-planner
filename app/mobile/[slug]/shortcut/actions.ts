"use server";

import { revalidatePath } from "next/cache";
import { generateToken, requireWorkspaceUser, sha256 } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function createShortcutImportToken(slug: string) {
  const user = await requireWorkspaceUser(slug);
  const token = `ft_sc_${generateToken()}`;

  const record = await prisma.shortcutImportToken.create({
    data: {
      workspaceId: user.workspace.id,
      tokenHash: sha256(token),
      label: "iPhone Save Recipe Shortcut",
    },
    select: { id: true },
  });

  revalidatePath(`/mobile/${slug}/shortcut`);
  return { id: record.id, token };
}

export async function revokeShortcutImportToken(slug: string, tokenId: string) {
  const user = await requireWorkspaceUser(slug);
  const result = await prisma.shortcutImportToken.updateMany({
    where: { id: tokenId, workspaceId: user.workspace.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (!result.count) throw new Error("Shortcut token not found");
  revalidatePath(`/mobile/${slug}/shortcut`);
}
