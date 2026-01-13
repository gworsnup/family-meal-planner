import "server-only";

import { prisma } from "@/lib/db";
import { generateSmartListForWorkspace } from "@/lib/smartListGenerator";

const RUNNING_TIMEOUT_MS = 10 * 60 * 1000;

function truncateError(value: string, maxLength = 500) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}…`;
}

export async function runSmartListJob(jobId: string) {
  const job = await prisma.smartListJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    console.warn("[SmartListJob] job not found", { jobId });
    return { ok: false };
  }

  if (job.status === "SUCCEEDED") {
    return { ok: true, skipped: true };
  }

  if (job.status === "RUNNING" && job.startedAt) {
    const elapsed = Date.now() - job.startedAt.getTime();
    if (elapsed < RUNNING_TIMEOUT_MS) {
      return { ok: true, skipped: true };
    }
  }

  const startedAt = new Date();
  await prisma.smartListJob.update({
    where: { id: jobId },
    data: {
      status: "RUNNING",
      startedAt,
      error: null,
    },
  });

  const runStart = Date.now();

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: job.workspaceId },
      select: { slug: true },
    });

    if (!workspace) {
      throw new Error("Workspace not found");
    }

    const { smartList } = await generateSmartListForWorkspace({
      workspaceId: job.workspaceId,
      workspaceSlug: workspace.slug,
      weekId: job.weekId,
    });

    if (!smartList?.id) {
      throw new Error("Smart list generation returned no id");
    }

    await prisma.smartListJob.update({
      where: { id: jobId },
      data: {
        status: "SUCCEEDED",
        smartListId: smartList.id,
        finishedAt: new Date(),
      },
    });

    console.log("[SmartListJob] succeeded", {
      jobId,
      durationMs: Date.now() - runStart,
    });

    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Smart list generation failed";
    await prisma.smartListJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        error: truncateError(message),
        finishedAt: new Date(),
      },
    });
    console.log("[SmartListJob] failed", {
      jobId,
      durationMs: Date.now() - runStart,
      message,
    });

    return { ok: false, error: message };
  }
}
