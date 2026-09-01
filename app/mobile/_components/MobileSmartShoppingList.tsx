"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SmartListData } from "@/lib/smartListTypes";
import { getSmartCategoryEmoji } from "@/lib/smartListPresentation";

type AggregatedCategory = {
  key: string;
  label: string;
  items: Array<{ id: string; display: string }>;
};

type SmartListJob = {
  id: string;
  weekId: string;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";
  error: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function MobileSmartShoppingList({
  workspaceId,
  weekId,
  weekVersion,
  weekStart,
  categories,
  smartList,
}: {
  workspaceId: string;
  weekId: string;
  weekVersion: number;
  weekStart: string;
  categories: AggregatedCategory[];
  smartList: SmartListData | null;
}) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"aggregated" | "smart">(smartList ? "smart" : "aggregated");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [job, setJob] = useState<SmartListJob | null>(null);
  const [enqueueing, setEnqueueing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeJobId = useRef<string | null>(null);
  const storageKey = `ft:mobile-shopping:${weekStart}:${viewMode}`;
  const smartListReady = Boolean(smartList && smartList.version === weekVersion);
  const smartListOutdated = Boolean(smartList && smartList.version < weekVersion);
  const generating = enqueueing || job?.status === "QUEUED" || job?.status === "RUNNING";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setChecked(new Set(JSON.parse(localStorage.getItem(storageKey) ?? "[]") as string[]));
      } catch {
        setChecked(new Set());
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [storageKey]);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      const query = new URLSearchParams({ workspaceId, weekId });
      const response = await fetch(`/api/smart-lists/jobs?${query.toString()}`, { cache: "no-store" });
      if (!response.ok || cancelled) return;
      const payload = (await response.json()) as { jobs?: SmartListJob[] };
      const jobs = payload.jobs ?? [];
      const active = jobs.find((candidate) => candidate.status === "QUEUED" || candidate.status === "RUNNING") ?? null;
      if (active) {
        activeJobId.current = active.id;
        setJob(active);
        return;
      }
      const completed = jobs.find((candidate) => candidate.id === activeJobId.current);
      if (!completed) return;
      activeJobId.current = null;
      setJob(null);
      if (completed.status === "SUCCEEDED") router.refresh();
      if (completed.status === "FAILED") setError(completed.error || "Couldn’t generate smart list.");
    };
    void poll();
    const interval = window.setInterval(() => void poll(), 2500);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [router, weekId, workspaceId]);

  const visibleCategories = useMemo(() => {
    if (viewMode === "smart" && smartList) {
      return smartList.categories.map((category) => ({
        key: category.name,
        label: category.name,
        emoji: getSmartCategoryEmoji(category.name),
        items: category.items.map((item) => ({
          id: item.id,
          display: item.displayText,
          isEstimated: item.isEstimated,
          isMerged: item.isMerged,
        })),
      }));
    }
    return categories.map((category) => ({ ...category, emoji: getSmartCategoryEmoji(category.key), items: category.items.map((item) => ({ ...item, isEstimated: false, isMerged: false })) }));
  }, [categories, smartList, viewMode]);

  const toggle = (id: string) => {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem(storageKey, JSON.stringify([...next]));
      return next;
    });
  };

  const generate = async () => {
    if (generating || smartListReady) return;
    setEnqueueing(true);
    setError(null);
    try {
      const response = await fetch("/api/smart-lists/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workspaceId, weekId, shoppingListId: weekId }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string; job?: SmartListJob } | null;
      if (!response.ok || !payload?.job) throw new Error(payload?.error || "Couldn’t generate smart list.");
      activeJobId.current = payload.job.id;
      setJob(payload.job);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Couldn’t generate smart list.");
    } finally {
      setEnqueueing(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center rounded-full border border-slate-200 bg-[#fcfcfc] p-1 text-xs font-medium text-slate-600">
            <button type="button" onClick={() => setViewMode("aggregated")} className={`rounded-full px-3 py-1 transition ${viewMode === "aggregated" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Aggregated</button>
            <button type="button" onClick={() => setViewMode("smart")} disabled={!smartList} className={`rounded-full px-3 py-1 transition ${viewMode === "smart" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"} ${!smartList ? "opacity-50" : ""}`}>Smart List</button>
          </div>
          <button type="button" onClick={() => void generate()} disabled={generating || smartListReady} className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition ${smartListReady || generating ? "cursor-not-allowed bg-slate-200 text-slate-700" : "bg-slate-900 text-white"}`}>
            {generating ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-slate-700" /> : <span>✨</span>}
            {smartListReady ? "Smart List Ready" : generating ? "Generating Smart List…" : "Generate Smart List"}
          </button>
        </div>
        {smartListOutdated ? <p className="mt-3 text-xs font-semibold text-amber-700">Your Smart List is out of date. Generate it again to include plan changes.</p> : null}
        {generating ? <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full w-1/2 animate-pulse rounded-full bg-slate-700" /></div> : null}
        {error ? <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p> : null}
      </section>

      {visibleCategories.map((category) => (
        <section key={category.key} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <h2 className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900"><span aria-hidden="true">{category.emoji}</span>{category.label}</h2>
          <ul className="divide-y divide-slate-100">
            {category.items.map((item) => {
              const done = checked.has(item.id);
              return <li key={item.id}><button type="button" onClick={() => toggle(item.id)} className="flex w-full items-start gap-3 px-4 py-3 text-left"><span className={`mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded border text-[10px] ${done ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300"}`}>{done ? "✓" : ""}</span><span className={`flex-1 text-sm leading-5 ${done ? "text-slate-400 line-through" : "text-slate-700"}`}>{item.display}<span className="ml-2 inline-flex gap-1">{item.isEstimated ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-semibold uppercase text-amber-700">Estimated</span> : null}{item.isMerged ? <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[9px] font-semibold uppercase text-indigo-700">Merged</span> : null}</span></span></button></li>;
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
