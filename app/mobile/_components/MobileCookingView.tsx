"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { RecipeDetail } from "@/app/g/[slug]/cook/types";

type WakeLockSentinel = { release: () => Promise<void> };

export default function MobileCookingView({ slug, recipe }: { slug: string; recipe: RecipeDetail }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const steps = useMemo(
    () => (recipe.directions ?? "").split(/\n+/).map((step) => step.trim()).filter(Boolean),
    [recipe.directions],
  );

  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const wakeLock = (navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinel> } }).wakeLock;
    if (wakeLock) void wakeLock.request("screen").then((value) => { lock = value; }).catch(() => null);
    return () => { if (lock) void lock.release(); };
  }, []);

  const toggle = (id: string) => {
    setChecked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Cooking mode</p><h1 className="mt-2 text-3xl font-bold leading-tight">{recipe.title}</h1></div>
        <Link href={`/mobile/${slug}/recipes/${recipe.id}`} className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-slate-200 bg-white text-xl">×</Link>
      </div>

      <section className="rounded-3xl bg-slate-900 p-5 text-white">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">Ingredients</h2>
        <ul className="mt-4 space-y-2">
          {recipe.ingredientLines.slice().sort((a, b) => a.position - b.position).map((line) => {
            const done = checked.has(line.id);
            return <li key={line.id}><button type="button" onClick={() => toggle(line.id)} className={`flex w-full items-start gap-3 rounded-2xl px-3 py-2 text-left text-base leading-6 ${done ? "text-slate-500 line-through" : "text-white"}`}><span className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-md border ${done ? "border-emerald-400 bg-emerald-400 text-slate-900" : "border-slate-500"}`}>{done ? "✓" : ""}</span>{line.ingredient}</button></li>;
          })}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold">Method</h2>
        {steps.length ? <ol className="mt-4 space-y-4">{steps.map((step, index) => <li key={`${index}-${step}`} className="rounded-3xl border border-slate-200 bg-white p-5"><div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-800">{index + 1}</div><p className="text-lg leading-8 text-slate-800">{step.replace(/^\d+[.)]\s*/, "")}</p></li>)}</ol> : <p className="mt-3 text-slate-500">No instructions added.</p>}
      </section>
    </div>
  );
}
