import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatWeekTitle } from "@/lib/shoppingList";
import { getEstimatedSmartListDurationSeconds } from "@/lib/smartListJobEstimate";

export const dynamic = "force-dynamic";
const ACTIVE_JOB_MAX_AGE_MS = 10 * 60 * 1000;

async function getBaseUrl() {
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "localhost:3000";
  const protocol = headersList.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const workspaceId = body?.workspaceId as string | undefined;
  const weekId = body?.weekId as string | undefined;
  const shoppingListId = body?.shoppingListId as string | undefined;

  if (!workspaceId || !weekId || !shoppingListId) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.isAdmin && user.workspace?.id !== workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const week = await prisma.shoppingListWeek.findFirst({
    where: { id: weekId, workspaceId },
  });

  if (!week) {
    return NextResponse.json({ error: "Shopping list not found" }, { status: 404 });
  }

  const existingJob = await prisma.smartListJob.findFirst({
    where: {
      workspaceId,
      weekId,
      status: { in: ["QUEUED", "RUNNING"] },
      updatedAt: {
        gte: new Date(Date.now() - ACTIVE_JOB_MAX_AGE_MS),
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      weekId: true,
      status: true,
      smartListId: true,
      createdAt: true,
      updatedAt: true,
      startedAt: true,
      finishedAt: true,
      error: true,
    },
  });
  const estimatedDurationSeconds =
    await getEstimatedSmartListDurationSeconds(workspaceId);

  if (existingJob) {
    return NextResponse.json({
      job: existingJob,
      estimatedDurationSeconds,
      deduplicated: true,
    });
  }

  const job = await prisma.smartListJob.create({
    data: {
      workspaceId,
      weekId,
      shoppingListId,
      shoppingListName: formatWeekTitle(week.weekStart),
      status: "QUEUED",
    },
    select: {
      id: true,
      weekId: true,
      status: true,
      smartListId: true,
      createdAt: true,
      updatedAt: true,
      startedAt: true,
      finishedAt: true,
      error: true,
    },
  });

  const origin = await getBaseUrl();
  void fetch(`${origin}/api/smart-lists/run`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jobId: job.id }),
  }).catch(() => null);

  return NextResponse.json({ job, estimatedDurationSeconds, deduplicated: false });
}
