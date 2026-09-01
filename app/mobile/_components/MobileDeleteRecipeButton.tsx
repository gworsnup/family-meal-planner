"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteRecipe } from "@/app/g/[slug]/cook/actions";

export default function MobileDeleteRecipeButton({
  slug,
  recipeId,
  recipeTitle,
}: {
  slug: string;
  recipeId: string;
  recipeTitle: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!window.confirm(`Delete “${recipeTitle}” from your library? This cannot be undone.`)) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteRecipe(slug, recipeId);
        router.replace(`/mobile/${slug}/recipes`);
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not delete this recipe.");
      }
    });
  };

  return (
    <div className="border-t border-slate-200 pt-5 text-center">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="text-sm font-semibold text-rose-700 underline decoration-rose-300 underline-offset-4 disabled:opacity-50"
      >
        {isPending ? "Deleting recipe…" : "Delete recipe"}
      </button>
      {error ? <p className="mt-3 text-sm text-rose-700" role="alert">{error}</p> : null}
    </div>
  );
}
