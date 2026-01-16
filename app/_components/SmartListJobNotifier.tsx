"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { buildSmartListPath } from "@/lib/smartListLinks";

const POLL_INTERVAL_MS = 4000;

// Dev note: enqueue a smart list job and wait for this notifier to surface success/failure.
type JobStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";

type JobSummary = {
  id: string;
  status: JobStatus;
  shoppingListName: string;
  smartListId: string | null;
  updatedAt: string;
  error: string | null;
};

type Notification = {
  id: string;
  type: "success" | "failure" | "progress";
  message: string;
  smartListId?: string | null;
  error?: string | null;
};

function loadSeenMap(workspaceId: string) {
  if (typeof window === "undefined") return {} as Record<string, JobStatus>;
  const raw = window.localStorage.getItem(`smartListJobsSeen:${workspaceId}`);
  if (!raw) return {} as Record<string, JobStatus>;
  try {
    return JSON.parse(raw) as Record<string, JobStatus>;
  } catch {
    return {} as Record<string, JobStatus>;
  }
}

function saveSeenMap(workspaceId: string, map: Record<string, JobStatus>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`smartListJobsSeen:${workspaceId}`, JSON.stringify(map));
}

export default function SmartListJobNotifier({
  workspaceId,
  workspaceSlug,
}: {
  workspaceId: string;
  workspaceSlug: string;
}) {
  const router = useRouter();
  const [queue, setQueue] = useState<Notification[]>([]);

  const active = queue[0] ?? null;
  const remainingCount = queue.length > 1 ? queue.length - 1 : 0;

  const fetchUrl = useMemo(
    () => `/api/smart-lists/jobs?workspaceId=${encodeURIComponent(workspaceId)}`,
    [workspaceId],
  );

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const response = await fetch(fetchUrl, { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json().catch(() => null)) as
          | { jobs?: JobSummary[] }
          | null;
        const jobs = payload?.jobs ?? [];
        if (cancelled) return;

        const seen = loadSeenMap(workspaceId);
        const nextSeen = { ...seen };
        const notifications: Notification[] = [];

        jobs.forEach((job) => {
          const previousStatus = seen[job.id];
          if (previousStatus !== job.status) {
            if (
              (job.status === "QUEUED" || job.status === "RUNNING") &&
              !previousStatus
            ) {
              notifications.push({
                id: job.id,
                type: "progress",
                message: `Generating Smart List for ${job.shoppingListName}…`,
              });
            }
            if (job.status === "SUCCEEDED") {
              if (!job.smartListId) {
                notifications.push({
                  id: job.id,
                  type: "failure",
                  message: `Smart List generation failed for ${job.shoppingListName}.`,
                  error: "Smart list was missing after completion.",
                });
              } else {
                notifications.push({
                  id: job.id,
                  type: "success",
                  message: `Smart List for ${job.shoppingListName} has been successfully generated.`,
                  smartListId: job.smartListId,
                });
              }
            }

            if (job.status === "FAILED") {
              notifications.push({
                id: job.id,
                type: "failure",
                message: `Smart List generation failed for ${job.shoppingListName}.`,
                error: job.error,
              });
            }
          }

          nextSeen[job.id] = job.status;
        });

        if (notifications.length > 0) {
          setQueue((current) => [...current, ...notifications]);
        }

        saveSeenMap(workspaceId, nextSeen);
      } catch {
        // ignore polling errors
      }
    };

    void poll();
    const interval = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [fetchUrl, workspaceId]);

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-[90vw] max-w-sm flex-col gap-3">
      <div className="pointer-events-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {active.type === "success"
                ? "Smart List Ready"
                : active.type === "failure"
                  ? "Smart List Failed"
                  : "Smart List Generating"}
            </p>
            <p className="mt-1 text-xs text-slate-600">{active.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setQueue((current) => current.slice(1))}
            className="text-slate-400 transition hover:text-slate-600"
            aria-label="Dismiss notification"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true">
              <path d="M4.3 4.3a1 1 0 011.4 0L10 8.6l4.3-4.3a1 1 0 111.4 1.4L11.4 10l4.3 4.3a1 1 0 01-1.4 1.4L10 11.4l-4.3 4.3a1 1 0 01-1.4-1.4L8.6 10 4.3 5.7a1 1 0 010-1.4z" />
            </svg>
          </button>
        </div>
        {active.type === "failure" && active.error ? (
          <p className="mt-2 text-xs text-rose-600">{active.error}</p>
        ) : null}
        <div className="mt-3 flex items-center gap-2">
          {active.type === "success" && active.smartListId ? (
            <button
              type="button"
              onClick={() => {
                setQueue((current) => current.slice(1));
                router.push(buildSmartListPath(workspaceSlug, active.smartListId));
              }}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              View List
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setQueue((current) => current.slice(1))}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
          >
            Dismiss
          </button>
          {remainingCount ? (
            <span className="text-[11px] text-slate-400">Next {remainingCount}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
