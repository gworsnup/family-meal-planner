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
        <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Cooking mode</p><h1 className="mt-2 text-2xl font-semibold leading-tight text-slate-900">{recipe.title}</h1></div>
        <Link href={`/mobile/${slug}/recipes/${recipe.id}`} className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-slate-200 bg-white text-xl">×</Link>
      </div>

      {recipe.photoUrl ? (
        // Imported recipe images can be hosted on arbitrary source domains.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={recipe.photoUrl} alt="" referrerPolicy="no-referrer" className="h-52 w-full rounded-2xl object-cover" />
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Ingredients</h2>
        <ul className="mt-4 space-y-2">
          {recipe.ingredientLines.slice().sort((a, b) => a.position - b.position).map((line) => {
            const done = checked.has(line.id);
            return <li key={line.id}><button type="button" onClick={() => toggle(line.id)} className={`flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left text-base leading-6 ${done ? "text-slate-400 line-through" : "text-slate-700"}`}><span className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded border ${done ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300"}`}>{done ? "✓" : ""}</span>{line.ingredient}</button></li>;
          })}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold">Method</h2>
        {steps.length ? <ol className="mt-4 space-y-4">{steps.map((step, index) => <li key={`${index}-${step}`} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">{index + 1}</div><p className="text-lg leading-8 text-slate-800">{step.replace(/^\d+[.)]\s*/, "")}</p></li>)}</ol> : <p className="mt-3 text-slate-500">No instructions added.</p>}
      </section>
    </div>
  );
}
