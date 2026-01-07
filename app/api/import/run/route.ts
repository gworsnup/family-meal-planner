import { NextResponse } from "next/server";
import { runRecipeImport } from "@/lib/scrape/runRecipeImport";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const importId = body?.importId as string | undefined;

  if (!importId) {
    return NextResponse.json({ error: "Missing importId" }, { status: 400 });
  }

  const record = await prisma.recipeImport.findUnique({
    where: { id: importId },
    select: { status: true },
  });

  if (!record) {
    return NextResponse.json({ error: "Import not found" }, { status: 404 });
  }

  if (record.status !== "queued") {
    return NextResponse.json({ ok: true });
  }

  try {
    await runRecipeImport(importId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 },
    );
  }
}
