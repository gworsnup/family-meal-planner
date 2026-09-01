"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { requireWorkspaceUser } from "@/lib/auth";
import { validateImportUrl } from "@/lib/scrape/validateImportUrl";

async function getBaseUrl() {
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

export async function startRecipeImport(slug: string, url: string) {
  const user = await requireWorkspaceUser(slug);

  const cleanedUrl = await validateImportUrl(url);

  const recipeImport = await prisma.recipeImport.create({
    data: {
      workspaceId: user.workspace.id,
      sourceUrl: cleanedUrl,
      status: "queued",
    },
    select: { id: true },
  });

  const origin = await getBaseUrl();
  void fetch(`${origin}/api/import/run`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ importId: recipeImport.id }),
  }).catch(() => null);

  return { importId: recipeImport.id };
}
