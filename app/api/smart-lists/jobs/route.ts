import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getEstimatedSmartListDurationSeconds } from "@/lib/smartListJobEstimate";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  const weekId = searchParams.get("weekId");

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

  const [jobs, estimatedDurationSeconds] = await Promise.all([
    prisma.smartListJob.findMany({
      where: { workspaceId, ...(weekId ? { weekId } : {}) },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        weekId: true,
        status: true,
        shoppingListName: true,
        smartListId: true,
        createdAt: true,
        updatedAt: true,
        startedAt: true,
        finishedAt: true,
        error: true,
        week: {
          select: { weekStart: true },
        },
      },
    }),
    getEstimatedSmartListDurationSeconds(workspaceId),
  ]);

  return NextResponse.json({ jobs, estimatedDurationSeconds });
}
