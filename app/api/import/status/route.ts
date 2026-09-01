import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const importId = searchParams.get("importId");

  if (!importId) {
    return NextResponse.json({ error: "Missing importId" }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const record = await prisma.recipeImport.findUnique({
    where: { id: importId },
    select: {
      workspaceId: true,
      status: true,
      error: true,
      recipeId: true,
    },
  });

  if (!record) {
    return NextResponse.json({ error: "Import not found" }, { status: 404 });
  }

  if (!user.isAdmin && record.workspaceId !== user.workspace?.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(record);
}
