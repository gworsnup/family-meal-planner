"use client";

import { useEffect } from "react";
import type { RecipeDetail } from "./types";

type CookingViewOverlayProps = {
  recipe: RecipeDetail;
  onClose: () => void;
};

export default function CookingViewOverlay({
  recipe,
  onClose,
}: CookingViewOverlayProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-white">
      <div className="flex h-full flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Cooking view
            </p>
            <h2 className="mt-1 text-3xl font-semibold text-slate-900">
              {recipe.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
            aria-label="Close cooking view"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
            <div className="space-y-6">
              {recipe.photoUrl ? (
                <img
                  src={recipe.photoUrl}
                  alt={recipe.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="max-h-[420px] w-full rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-64 w-full items-center justify-center rounded-2xl bg-slate-100 text-sm text-slate-400">
                  No photo available
                </div>
              )}

              <section>
                <h3 className="text-lg font-semibold text-slate-900">
                  Directions
                </h3>
                <div className="mt-3 whitespace-pre-line text-lg leading-relaxed text-slate-700">
                  {recipe.directions?.trim()
                    ? recipe.directions
                    : "No directions added yet."}
                </div>
              </section>
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
              <h3 className="text-lg font-semibold text-slate-900">
                Ingredients
              </h3>
              {recipe.ingredientLines.length > 0 ? (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-base text-slate-700">
                  {recipe.ingredientLines
                    .slice()
                    .sort((a, b) => a.position - b.position)
                    .map((line) => (
                      <li key={line.id}>{line.ingredient}</li>
                    ))}
                </ul>
              ) : (
                <p className="mt-3 text-base text-slate-600">
                  No ingredients added yet.
                </p>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
