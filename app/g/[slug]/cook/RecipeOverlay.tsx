"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import RatingStars from "./RatingStars";
import { deleteRecipe, updateRecipe } from "./actions";
import type { RecipeDetail, UpdateRecipeInput } from "./types";

type RecipeOverlayProps = {
  slug: string;
  recipe: RecipeDetail;
  onClose: () => void;
  onDeleted: () => void;
  onSaved: () => void;
};

function formatMinutes(minutes?: number | null) {
  if (minutes === null || minutes === undefined) return "—";
  return `${minutes} min`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function isTikTokUrl(value?: string | null) {
  if (!value) return false;
  try {
    return new URL(value).hostname.replace(/^www\./, "").includes("tiktok.com");
  } catch {
    return false;
  }
}

function getIngredientsText(recipe: RecipeDetail) {
  return recipe.ingredientLines
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((line) => line.ingredient)
    .join("\n");
}

export default function RecipeOverlay({
  slug,
  recipe,
  onClose,
  onDeleted,
  onSaved,
}: RecipeOverlayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const initialForm = useMemo<UpdateRecipeInput>(
    () => ({
      title: recipe.title,
      description: recipe.description ?? "",
      sourceName: recipe.sourceName ?? "",
      sourceUrl: recipe.sourceUrl ?? "",
      photoUrl: recipe.photoUrl ?? "",
      directions: recipe.directions ?? "",
      prepTimeMinutes: recipe.prepTimeMinutes ?? null,
      cookTimeMinutes: recipe.cookTimeMinutes ?? null,
      totalTimeMinutes: recipe.totalTimeMinutes ?? null,
      servings: recipe.servings ?? "",
      yields: recipe.yields ?? "",
      rating: recipe.rating ?? 0,
      isPrivate: recipe.isPrivate,
      ingredientsText: getIngredientsText(recipe),
    }),
    [recipe],
  );

  const [formState, setFormState] = useState<UpdateRecipeInput>(initialForm);
  const [showPhotoInput, setShowPhotoInput] = useState(false);

  useEffect(() => {
    setFormState(initialForm);
    setIsEditing(false);
    setShowPhotoInput(false);
  }, [initialForm]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSave = () => {
    startTransition(async () => {
      await updateRecipe(slug, recipe.id, {
        ...formState,
        rating: Number.isNaN(formState.rating) ? 0 : formState.rating,
        prepTimeMinutes: formState.prepTimeMinutes ?? null,
        cookTimeMinutes: formState.cookTimeMinutes ?? null,
        totalTimeMinutes: formState.totalTimeMinutes ?? null,
      });
      setIsEditing(false);
      onSaved();
    });
  };

  const handleDelete = () => {
    if (!confirm("Delete this recipe?")) return;
    startTransition(async () => {
      await deleteRecipe(slug, recipe.id);
      onDeleted();
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[min(92vh,900px)] w-[min(1000px,96vw)] flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="text-lg font-semibold text-slate-900">
            {isEditing ? formState.title : recipe.title}
          </div>
          <div className="flex flex-wrap gap-2">
            {!isEditing && (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600 hover:border-red-300"
                >
                  Delete
                </button>
              </>
            )}
            {isEditing && (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormState(initialForm);
                    setIsEditing(false);
                    setShowPhotoInput(false);
                  }}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
                >
                  Cancel
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6 overflow-y-auto p-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <div className="relative">
              {(isEditing ? formState.photoUrl : recipe.photoUrl) ? (
                <img
                  src={isEditing ? formState.photoUrl ?? "" : recipe.photoUrl ?? ""}
                  alt={recipe.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="max-h-80 w-full rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-56 w-full flex-col items-center justify-center gap-2 rounded-xl bg-slate-100 text-sm text-slate-400">
                  <span>No photo</span>
                  {isTikTokUrl(recipe.sourceUrl) && recipe.sourceUrl && (
                    <a
                      href={recipe.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-emerald-600 underline"
                    >
                      Open TikTok
                    </a>
                  )}
                </div>
              )}
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setShowPhotoInput((value) => !value)}
                  className="absolute bottom-3 right-3 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm"
                >
                  Update photo
                </button>
              )}
              {isEditing && showPhotoInput && (
                <input
                  type="url"
                  value={formState.photoUrl ?? ""}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      photoUrl: event.target.value,
                    }))
                  }
                  placeholder="Photo URL"
                  className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              )}
            </div>

            <div className="flex flex-col gap-4">
              {isEditing ? (
                <input
                  type="text"
                  value={formState.title}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-lg font-semibold text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              ) : (
                <div className="text-2xl font-semibold text-slate-900">
                  {recipe.title}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      placeholder="Source name"
                      value={formState.sourceName ?? ""}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          sourceName: event.target.value,
                        }))
                      }
                      className="min-w-[160px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                    <input
                      type="url"
                      placeholder="Source URL"
                      value={formState.sourceUrl ?? ""}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          sourceUrl: event.target.value,
                        }))
                      }
                      className="min-w-[160px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </>
                ) : (
                  <div className="text-sm text-slate-600">
                    {recipe.sourceUrl ? (
                      <a
                        href={recipe.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-emerald-600"
                      >
                        {recipe.sourceName || recipe.sourceUrl}
                      </a>
                    ) : (
                      recipe.sourceName || "—"
                    )}
                  </div>
                )}
              </div>

              {isEditing ? (
                <textarea
                  value={formState.description ?? ""}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Description"
                  rows={3}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              ) : (
                <div className="text-sm text-slate-600">
                  {recipe.description || "No description."}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                {isEditing ? (
                  <>
                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Prep (min)
                      <input
                        type="number"
                        min={0}
                        value={formState.prepTimeMinutes ?? ""}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            prepTimeMinutes: event.target.value
                              ? Number(event.target.value)
                              : null,
                          }))
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Cook (min)
                      <input
                        type="number"
                        min={0}
                        value={formState.cookTimeMinutes ?? ""}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            cookTimeMinutes: event.target.value
                              ? Number(event.target.value)
                              : null,
                          }))
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Total (min)
                      <input
                        type="number"
                        min={0}
                        value={formState.totalTimeMinutes ?? ""}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            totalTimeMinutes: event.target.value
                              ? Number(event.target.value)
                              : null,
                          }))
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-slate-600">
                      Prep: {formatMinutes(recipe.prepTimeMinutes)}
                    </div>
                    <div className="text-sm text-slate-600">
                      Cook: {formatMinutes(recipe.cookTimeMinutes)}
                    </div>
                    <div className="text-sm text-slate-600">
                      Total: {formatMinutes(recipe.totalTimeMinutes)}
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      placeholder="Servings"
                      value={formState.servings ?? ""}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          servings: event.target.value,
                        }))
                      }
                      className="min-w-[120px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                    <input
                      type="text"
                      placeholder="Yields"
                      value={formState.yields ?? ""}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          yields: event.target.value,
                        }))
                      }
                      className="min-w-[120px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </>
                ) : (
                  <>
                    <div className="text-sm text-slate-600">
                      Servings: {recipe.servings || "—"}
                    </div>
                    <div className="text-sm text-slate-600">
                      Yields: {recipe.yields || "—"}
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Rating
                </span>
                {isEditing ? (
                  <RatingStars
                    value={formState.rating ?? 0}
                    onSet={(value) =>
                      setFormState((prev) => ({ ...prev, rating: value }))
                    }
                    stopPropagation
                  />
                ) : (
                  <RatingStars value={recipe.rating ?? 0} onSet={() => undefined} disabled />
                )}
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-600">
                {isEditing ? (
                  <>
                    <input
                      type="checkbox"
                      checked={formState.isPrivate}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          isPrivate: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    Private recipe
                  </>
                ) : (
                  <div>
                    Privacy: {recipe.isPrivate ? "Private" : "Shared"}
                  </div>
                )}
              </label>

              <div className="text-xs text-slate-400">
                Updated {formatDate(recipe.updatedAt)} · Created {formatDate(recipe.createdAt)}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Ingredients</h3>
              {isEditing ? (
                <textarea
                  value={formState.ingredientsText}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      ingredientsText: event.target.value,
                    }))
                  }
                  rows={10}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              ) : (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  {recipe.ingredientLines.length > 0 ? (
                    recipe.ingredientLines
                      .slice()
                      .sort((a, b) => a.position - b.position)
                      .map((line) => <li key={line.id}>{line.ingredient}</li>)
                  ) : (
                    <li>No ingredients listed.</li>
                  )}
                </ul>
              )}
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-900">Directions</h3>
              {isEditing ? (
                <textarea
                  value={formState.directions ?? ""}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      directions: event.target.value,
                    }))
                  }
                  rows={10}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              ) : (
                <div className="mt-2 whitespace-pre-line text-sm text-slate-600">
                  {recipe.directions || "No directions provided."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
