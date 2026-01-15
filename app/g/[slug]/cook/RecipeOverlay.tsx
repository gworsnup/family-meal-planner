"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import RatingStars from "./RatingStars";
import {
  addOrCreateTagToRecipe,
  deleteRecipe,
  getWorkspaceTags,
  toggleRecipeTag,
  updateRecipe,
} from "./actions";
import type { RecipeDetail, UpdateRecipeInput } from "./types";

type RecipeOverlayProps = {
  slug: string;
  recipe: RecipeDetail;
  onClose: () => void;
  onDeleted: () => void;
  onSaved: () => void;
  onOpenCookingView: () => void;
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

function normalizeTagName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function formatTagName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export default function RecipeOverlay({
  slug,
  recipe,
  onClose,
  onDeleted,
  onSaved,
  onOpenCookingView,
}: RecipeOverlayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isTagPending, startTagTransition] = useTransition();

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
  const [workspaceTags, setWorkspaceTags] = useState<RecipeDetail["tags"]>([]);
  const [recipeTags, setRecipeTags] = useState<RecipeDetail["tags"]>(recipe.tags);
  const [tagSearch, setTagSearch] = useState("");
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false);
  const [tagMessage, setTagMessage] = useState<string | null>(null);

  useEffect(() => {
    setFormState(initialForm);
    setIsEditing(false);
    setShowPhotoInput(false);
    setRecipeTags(recipe.tags);
    setIsTagPopoverOpen(false);
    setTagSearch("");
  }, [initialForm]);

  useEffect(() => {
    let isMounted = true;
    startTagTransition(async () => {
      try {
        const tags = await getWorkspaceTags(slug);
        if (isMounted) setWorkspaceTags(tags);
      } catch (error) {
        console.error(error);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [slug, startTagTransition]);

  useEffect(() => {
    if (!tagMessage) return;
    const timeout = window.setTimeout(() => setTagMessage(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [tagMessage]);

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
    onClose();
    startTransition(async () => {
      await deleteRecipe(slug, recipe.id);
      onDeleted();
    });
  };

  const showTagMessage = (message: string) => {
    setTagMessage(message);
  };

  const handleToggleTag = (tagId: string) => {
    const previousTags = recipeTags;
    const isApplied = recipeTags.some((tag) => tag.id === tagId);
    const nextTags = isApplied
      ? recipeTags.filter((tag) => tag.id !== tagId)
      : (() => {
          const tagToAdd = workspaceTags.find((tag) => tag.id === tagId);
          if (!tagToAdd) return recipeTags;
          return [...recipeTags, tagToAdd];
        })();

    setRecipeTags(nextTags);
    startTagTransition(async () => {
      try {
        const updatedTags = await toggleRecipeTag(
          slug,
          recipe.id,
          tagId,
          !isApplied,
        );
        setRecipeTags(updatedTags);
      } catch (error) {
        console.error(error);
        setRecipeTags(previousTags);
        showTagMessage("Couldn't update tags. Please try again.");
      }
    });
  };

  const handleCreateTag = (value: string) => {
    const formattedName = formatTagName(value);
    if (!formattedName) return;
    const tempTag = { id: `temp-${Date.now()}`, name: formattedName };
    const previousRecipeTags = recipeTags;
    const previousWorkspaceTags = workspaceTags;

    setRecipeTags((prev) => [...prev, tempTag]);
    setWorkspaceTags((prev) => {
      if (prev.some((tag) => normalizeTagName(tag.name) === normalizeTagName(formattedName))) {
        return prev;
      }
      return [...prev, tempTag].sort((a, b) => a.name.localeCompare(b.name));
    });
    setTagSearch("");

    startTagTransition(async () => {
      try {
        const result = await addOrCreateTagToRecipe(slug, recipe.id, formattedName);
        setRecipeTags(result.recipeTags);
        setWorkspaceTags((prev) => {
          const withoutTemp = prev.filter((tag) => tag.id !== tempTag.id);
          if (withoutTemp.some((tag) => tag.id === result.tag.id)) {
            return withoutTemp;
          }
          return [...withoutTemp, result.tag].sort((a, b) => a.name.localeCompare(b.name));
        });
      } catch (error) {
        console.error(error);
        setRecipeTags(previousRecipeTags);
        setWorkspaceTags(previousWorkspaceTags);
        showTagMessage("Couldn't create tag. Please try again.");
      }
    });
  };

  const normalizedSearch = normalizeTagName(tagSearch);
  const filteredTags = useMemo(() => {
    if (!normalizedSearch) return workspaceTags;
    return workspaceTags.filter((tag) =>
      normalizeTagName(tag.name).includes(normalizedSearch),
    );
  }, [normalizedSearch, workspaceTags]);
  const exactMatch = normalizedSearch
    ? workspaceTags.find(
        (tag) => normalizeTagName(tag.name) === normalizedSearch,
      )
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex h-[min(92vh,900px)] w-[min(1000px,96vw)] flex-col overflow-hidden rounded-2xl bg-white"
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
                  onClick={onOpenCookingView}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
                >
                  Cooking view
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
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800"
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
                      className="text-xs font-semibold text-slate-900 underline"
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
                  className="absolute bottom-3 right-3 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
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
                  className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
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
                  className="rounded-xl border border-slate-200 px-3 py-2 text-lg font-semibold text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
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
                      className="min-w-[160px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
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
                      className="min-w-[160px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                  </>
                ) : (
                  <div className="text-sm text-slate-600">
                    {recipe.sourceUrl ? (
                      <a
                        href={recipe.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-slate-900"
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
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
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
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
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
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
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
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
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
                      className="min-w-[120px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
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
                      className="min-w-[120px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
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

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Tags
                  </span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsTagPopoverOpen((prev) => !prev)}
                      disabled={isTagPending}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:text-slate-900"
                    >
                      Add tag
                    </button>
                    {isTagPopoverOpen && (
                      <div className="absolute right-0 z-10 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                        <input
                          type="text"
                          value={tagSearch}
                          onChange={(event) => setTagSearch(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && normalizedSearch && !exactMatch) {
                              event.preventDefault();
                              handleCreateTag(tagSearch);
                              setIsTagPopoverOpen(false);
                            }
                          }}
                          placeholder="Search tags…"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                        <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-100">
                          {filteredTags.length > 0 ? (
                            filteredTags.map((tag) => {
                              const isApplied = recipeTags.some(
                                (item) => item.id === tag.id,
                              );
                              return (
                                <button
                                  key={tag.id}
                                  type="button"
                                  onClick={() => handleToggleTag(tag.id)}
                                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                >
                                  <span>{tag.name}</span>
                                  {isApplied && (
                                    <span className="text-xs font-semibold text-slate-500">
                                      ✓
                                    </span>
                                  )}
                                </button>
                              );
                            })
                          ) : (
                            <div className="px-3 py-2 text-sm text-slate-400">
                              No tags yet.
                            </div>
                          )}
                        </div>
                        <div className="mt-2 border-t border-slate-100 pt-2">
                          {normalizedSearch && !exactMatch ? (
                            <button
                              type="button"
                              onClick={() => {
                                handleCreateTag(tagSearch);
                                setIsTagPopoverOpen(false);
                              }}
                              className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Create “{formatTagName(tagSearch)}”
                            </button>
                          ) : (
                            <div className="px-3 py-2 text-sm text-slate-400">
                              Start typing to create a tag.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recipeTags.length > 0 ? (
                    recipeTags.map((tag) => (
                      <span
                        key={tag.id}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                      >
                        {tag.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-400">No tags yet.</span>
                  )}
                </div>
                {isEditing && (
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={formState.isPrivate}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          isPrivate: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/30"
                    />
                    Private recipe
                  </label>
                )}
              </div>

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
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
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
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              ) : (
                <div className="mt-2 whitespace-pre-line text-sm text-slate-600">
                  {recipe.directions || "No directions provided."}
                </div>
              )}
            </div>
          </div>
        </div>
        {tagMessage && (
          <div className="pointer-events-none absolute bottom-4 right-4 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
            {tagMessage}
          </div>
        )}
      </div>
    </div>
  );
}
