import { NextResponse } from "next/server";
import { runRecipeImport } from "@/lib/scrape/runRecipeImport";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const importId = body?.importId as string | undefined;

  if (!importId) {
    return NextResponse.json({ error: "Missing importId" }, { status: 400 });
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
