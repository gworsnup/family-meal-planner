"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateRecipe } from "@/app/g/[slug]/cook/actions";
import type { RecipeDetail } from "@/app/g/[slug]/cook/types";

export default function MobileRecipeReview({
  slug,
  recipe,
}: {
  slug: string;
  recipe: RecipeDetail;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(recipe.title);
  const [ingredients, setIngredients] = useState(
    recipe.ingredientLines
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((line) => line.ingredient)
      .join("\n"),
  );
  const [directions, setDirections] = useState(recipe.directions ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => {
    setError(null);
    startTransition(async () => {
      try {
        await updateRecipe(slug, recipe.id, {
          title,
          description: recipe.description,
          sourceName: recipe.sourceName,
          sourceUrl: recipe.sourceUrl,
          photoUrl: recipe.photoUrl,
          directions,
          prepTimeMinutes: recipe.prepTimeMinutes,
          cookTimeMinutes: recipe.cookTimeMinutes,
          totalTimeMinutes: recipe.totalTimeMinutes,
          servings: recipe.servings,
          yields: recipe.yields,
          rating: recipe.rating,
          isPrivate: recipe.isPrivate,
          ingredientsText: ingredients,
        });
        router.replace(`/mobile/${slug}/recipes/${recipe.id}?saved=1`);
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not save this recipe.");
      }
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Import complete</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Quick recipe check</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Social posts can be inconsistent. Check the important bits before saving.
        </p>
      </div>

      {recipe.photoUrl ? (
        // Imported recipe images can be hosted on arbitrary source domains.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={recipe.photoUrl} alt="" referrerPolicy="no-referrer" className="h-48 w-full rounded-3xl object-cover" />
      ) : null}

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="grid gap-2 text-sm font-bold text-slate-800">
          Recipe name
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-base font-normal outline-none focus:border-slate-400" />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-800">
          Ingredients <span className="font-normal text-slate-400">one per line</span>
          <textarea value={ingredients} onChange={(event) => setIngredients(event.target.value)} rows={8} className="resize-y rounded-2xl border border-slate-200 px-4 py-3 text-base font-normal leading-6 outline-none focus:border-slate-400" />
        </label>
        <label className="grid gap-2 text-sm font-bold text-slate-800">
          Instructions
          <textarea value={directions} onChange={(event) => setDirections(event.target.value)} rows={10} className="resize-y rounded-2xl border border-slate-200 px-4 py-3 text-base font-normal leading-6 outline-none focus:border-slate-400" />
        </label>
        {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        <button type="button" onClick={save} disabled={pending || !title.trim()} className="w-full rounded-2xl bg-slate-900 px-4 py-3.5 text-base font-bold text-white disabled:opacity-50">
          {pending ? "Saving…" : "Save to library"}
        </button>
      </section>
    </div>
  );
}
