import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatWeekTitle } from "@/lib/shoppingList";

export const dynamic = "force-dynamic";

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

  const job = await prisma.smartListJob.create({
    data: {
      workspaceId,
      weekId,
      shoppingListId,
      shoppingListName: formatWeekTitle(week.weekStart),
      status: "QUEUED",
    },
    select: { id: true, status: true },
  });

  const origin = await getBaseUrl();
  void fetch(`${origin}/api/smart-lists/run`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jobId: job.id }),
  }).catch(() => null);

  return NextResponse.json({ jobId: job.id, status: job.status });
}
