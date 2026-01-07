import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const importId = searchParams.get("importId");

  if (!importId) {
    return NextResponse.json({ error: "Missing importId" }, { status: 400 });
  }

  const record = await prisma.recipeImport.findUnique({
    where: { id: importId },
    select: {
      status: true,
      error: true,
      recipeId: true,
    },
  });

  if (!record) {
    return NextResponse.json({ error: "Import not found" }, { status: 404 });
  }

  return NextResponse.json(record);
}
