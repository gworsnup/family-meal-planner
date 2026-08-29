import "server-only";

import { prisma } from "@/lib/db";

const DEFAULT_ESTIMATED_DURATION_SECONDS = 60;
const MAX_RECORDED_DURATION_SECONDS = 10 * 60;

export async function getEstimatedSmartListDurationSeconds(workspaceId: string) {
  const completedJobs = await prisma.smartListJob.findMany({
    where: {
      workspaceId,
      status: "SUCCEEDED",
      startedAt: { not: null },
      finishedAt: { not: null },
    },
    orderBy: { finishedAt: "desc" },
    take: 30,
    select: { startedAt: true, finishedAt: true },
  });

  const durations = completedJobs
    .flatMap((job) =>
      job.startedAt && job.finishedAt
        ? [(job.finishedAt.getTime() - job.startedAt.getTime()) / 1000]
        : [],
    )
    .filter(
      (duration) => duration >= 3 && duration <= MAX_RECORDED_DURATION_SECONDS,
    )
    .sort((a, b) => a - b);

  if (durations.length === 0) return DEFAULT_ESTIMATED_DURATION_SECONDS;

  const middle = Math.floor(durations.length / 2);
  const median =
    durations.length % 2 === 0
      ? (durations[middle - 1] + durations[middle]) / 2
      : durations[middle];

  return Math.min(180, Math.max(15, Math.round(median / 5) * 5));
}
