import { after, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sha256 } from "@/lib/auth";
import { runRecipeImport } from "@/lib/scrape/runRecipeImport";
import { validateImportUrl } from "@/lib/scrape/validateImportUrl";

export const maxDuration = 300;

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Missing Shortcut token" }, { status: 401 });
  }

  const tokenRecord = await prisma.shortcutImportToken.findFirst({
    where: { tokenHash: sha256(token), revokedAt: null },
    select: { id: true, workspaceId: true, workspace: { select: { slug: true } } },
  });
  if (!tokenRecord) {
    return NextResponse.json({ error: "Invalid or revoked Shortcut token" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const rawUrl = typeof body?.url === "string" ? body.url : "";

  let sourceUrl: string;
  try {
    sourceUrl = await validateImportUrl(rawUrl);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid recipe URL" },
      { status: 400 },
    );
  }

  const [recipeImport] = await prisma.$transaction([
    prisma.recipeImport.create({
      data: { workspaceId: tokenRecord.workspaceId, sourceUrl, status: "queued" },
      select: { id: true },
    }),
    prisma.shortcutImportToken.update({
      where: { id: tokenRecord.id },
      data: { lastUsedAt: new Date() },
    }),
  ]);

  after(async () => {
    try {
      await runRecipeImport(recipeImport.id);
    } catch (error) {
      console.error("[ShortcutImport] Background import failed", {
        importId: recipeImport.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  const origin = new URL(request.url).origin;
  return NextResponse.json(
    {
      ok: true,
      importId: recipeImport.id,
      status: "queued",
      libraryUrl: `${origin}/mobile/${tokenRecord.workspace.slug}/recipes`,
    },
    { status: 202 },
  );
}
