import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.isAdmin && user.workspace?.id !== workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const jobs = await prisma.smartListJob.findMany({
    where: { workspaceId },
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: {
      id: true,
      status: true,
      shoppingListName: true,
      smartListId: true,
      updatedAt: true,
      error: true,
    },
  });

  return NextResponse.json({ jobs });
}
