"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import RatingStars from "./RatingStars";
import CookingViewOverlay from "./CookingViewOverlay";
import RecipeOverlay from "./RecipeOverlay";
import { setRecipeRating } from "./actions";
import { startRecipeImport } from "./importActions";
import type { RecipeDetail } from "./types";

type RecipeItem = {
  id: string;
  title: string;
  photoUrl: string | null;
  rating: number | null;
  sourceName: string | null;
  sourceUrl: string | null;
  totalTimeMinutes: number | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  updatedAt: string;
  isPrivate: boolean;
};

type ViewMode = "table" | "grid";

type SortField =
  | "updatedAt"
  | "title"
  | "rating"
  | "totalTimeMinutes"
  | "sourceName";

type SortDirection = "asc" | "desc";

type CookClientProps = {
  slug: string;
  workspaceName: string;
  recipes: RecipeItem[];
  view: ViewMode;
  q: string;
  minRating: number;
  manualOnly: boolean;
  sort: SortField;
  dir: SortDirection;
  selectedRecipe: RecipeDetail | null;
  selectedCookingRecipe: RecipeDetail | null;
};

const sortOptions: Array<{ label: string; value: `${SortField}:${SortDirection}` }> = [
  { label: "Last updated (newest)", value: "updatedAt:desc" },
  { label: "Last updated (oldest)", value: "updatedAt:asc" },
  { label: "Title (A–Z)", value: "title:asc" },
  { label: "Title (Z–A)", value: "title:desc" },
  { label: "Rating (high → low)", value: "rating:desc" },
  { label: "Rating (low → high)", value: "rating:asc" },
  { label: "Total time (short → long)", value: "totalTimeMinutes:asc" },
  { label: "Total time (long → short)", value: "totalTimeMinutes:desc" },
  { label: "Source (A–Z)", value: "sourceName:asc" },
  { label: "Source (Z–A)", value: "sourceName:desc" },
];

function formatSource(sourceName?: string | null, sourceUrl?: string | null) {
  if (sourceName?.trim()) return sourceName;
  if (sourceUrl) {
    try {
      const url = new URL(sourceUrl);
      return url.hostname.replace(/^www\./, "");
    } catch {
      return sourceUrl;
    }
  }
  return "—";
}

function getTotalMinutes(recipe: RecipeItem) {
  return (
    recipe.totalTimeMinutes ?? recipe.cookTimeMinutes ?? recipe.prepTimeMinutes
  );
}

function formatMinutes(minutes?: number | null) {
  if (minutes === null || minutes === undefined) return "—";
  return `${minutes} min`;
}

function formatUpdated(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getDefaultDir(sort: SortField) {
  return sort === "title" || sort === "sourceName" ? "asc" : "desc";
}

export default function CookClient({
  slug,
  workspaceName,
  recipes,
  view,
  q,
  minRating,
  manualOnly,
  sort,
  dir,
  selectedRecipe,
  selectedCookingRecipe,
}: CookClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRatingPending, startRatingTransition] = useTransition();
  const [isImportPending, startImportTransition] = useTransition();
  const [importUrl, setImportUrl] = useState("");
  const [importStatus, setImportStatus] = useState<
    "idle" | "queued" | "running" | "success" | "partial" | "failed"
  >("idle");
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importId, setImportId] = useState<string | null>(null);
  const [importRecipeId, setImportRecipeId] = useState<string | null>(null);

  const currentParams = useMemo(
    () => new URLSearchParams(searchParams.toString()),
    [searchParams],
  );

  const currentView = (currentParams.get("view") as ViewMode | null) ?? view;
  const currentSort = (currentParams.get("sort") as SortField | null) ?? sort;
  const currentDir = (currentParams.get("dir") as SortDirection | null) ?? dir;
  const storageKey = useMemo(() => `ft_recipes_view_${slug}`, [slug]);
  const currentMinRating = (() => {
    const raw = currentParams.get("minRating");
    const parsed = Number(raw ?? minRating);
    return Number.isNaN(parsed) ? minRating : parsed;
  })();
  const currentManualOnly = currentParams.get("manual")
    ? currentParams.get("manual") === "1"
    : manualOnly;
  const currentRecipeId = currentParams.get("recipeId") ?? selectedRecipe?.id ?? null;
  const currentCookRecipeId =
    currentParams.get("cookRecipeId") ?? selectedCookingRecipe?.id ?? null;
  const isCookingView = currentParams.get("cookView") === "1";

  const [searchText, setSearchText] = useState(currentParams.get("q") ?? q);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      const next = params.toString();
      const current = searchParams.toString();
      if (next === current) return;
      router.push(next ? `?${next}` : "?");
    },
    [router, searchParams],
  );

  useEffect(() => {
    setSearchText(currentParams.get("q") ?? q);
  }, [currentParams, q]);

  useEffect(() => {
    const paramView = currentParams.get("view");
    if (paramView === "table" || paramView === "grid") {
      window.localStorage.setItem(storageKey, paramView);
      return;
    }
    const stored = window.localStorage.getItem(storageKey);
    if ((stored === "table" || stored === "grid") && stored !== currentView) {
      updateParams({ view: stored });
    }
  }, [currentParams, currentView, storageKey, updateParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateParams({ q: searchText.trim() || null });
    }, 250);
    return () => clearTimeout(timer);
  }, [searchText, updateParams]);

  const handleRating = useCallback(
    (recipeId: string, ratingValue: number) => {
      startRatingTransition(async () => {
        await setRecipeRating(slug, recipeId, ratingValue);
        router.refresh();
      });
    },
    [router, slug, startRatingTransition],
  );

  const openRecipe = (recipeId: string) => {
    updateParams({ recipeId, cookRecipeId: null, cookView: null });
  };

  const openCookingView = (recipeId: string) => {
    updateParams({ cookRecipeId: recipeId, cookView: "1", recipeId: null });
  };

  const handleViewChange = (nextView: ViewMode) => {
    updateParams({ view: nextView });
    window.localStorage.setItem(storageKey, nextView);
  };

  const renderTableThumbnail = (recipe: RecipeItem) => {
    if (recipe.photoUrl) {
      return (
        <img
          src={recipe.photoUrl}
          alt={recipe.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-20 w-20 rounded-xl object-cover"
        />
      );
    }

    return (
      <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-slate-100 text-[11px] font-medium text-slate-400">
        No photo
      </div>
    );
  };

  const renderGridImage = (recipe: RecipeItem) => {
    if (recipe.photoUrl) {
      return (
        <img
          src={recipe.photoUrl}
          alt={recipe.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-44 w-full rounded-t-2xl object-cover"
        />
      );
    }

    return (
      <div className="flex h-44 w-full flex-col items-center justify-center gap-2 rounded-t-2xl bg-slate-100 text-sm text-slate-400">
        <span className="text-2xl">🍽️</span>
        <span>No photo</span>
      </div>
    );
  };

  const sortIndicator = (field: SortField) => {
    if (currentSort !== field) return "";
    return currentDir === "asc" ? "▲" : "▼";
  };

  const handleSort = (field: SortField) => {
    const nextDir =
      currentSort === field
        ? currentDir === "asc"
          ? "desc"
          : "asc"
        : getDefaultDir(field);
    updateParams({ sort: field, dir: nextDir });
  };

  const handleSortSelect = (value: string) => {
    const [nextSort, nextDir] = value.split(":") as [SortField, SortDirection];
    updateParams({ sort: nextSort, dir: nextDir });
  };

  const handleImport = () => {
    const trimmed = importUrl.trim();
    if (!trimmed) {
      setImportMessage("Enter a recipe URL to import.");
      setImportStatus("failed");
      return;
    }

    setImportMessage(null);
    startImportTransition(async () => {
      try {
        const { importId: nextImportId, recipeId } = await startRecipeImport(
          slug,
          trimmed,
        );
        setImportId(nextImportId);
        setImportRecipeId(recipeId);
        setImportStatus("queued");
        updateParams({ recipeId });
        router.refresh();
      } catch (error) {
        setImportStatus("failed");
        setImportMessage(
          error instanceof Error ? error.message : "Unable to import URL.",
        );
      }
    });
  };

  useEffect(() => {
    if (!importId) return;
    let isActive = true;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/import/status?importId=${importId}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as {
          status?: "queued" | "running" | "success" | "partial" | "failed";
          error?: string | null;
        };
        if (!isActive || !data.status) return;
        setImportStatus(data.status);
        setImportMessage(data.error ?? null);
        if (data.status === "success" || data.status === "partial") {
          if (importRecipeId) {
            updateParams({ recipeId: importRecipeId });
          }
          router.refresh();
        }
        if (data.status === "failed" || data.status === "success" || data.status === "partial") {
          setImportId(null);
        }
      } catch {
        // ignore polling errors
      }
    };

    void pollStatus();
    const interval = setInterval(pollStatus, 2000);
    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [importId, importRecipeId, router, updateParams]);

  const importStatusLabel = (() => {
    switch (importStatus) {
      case "queued":
        return "Queued for import…";
      case "running":
        return "Importing…";
      case "success":
        return "Import complete.";
      case "partial":
        return "Imported with partial data.";
      case "failed":
        return importMessage ?? "Import failed.";
      default:
        return importMessage;
    }
  })();

  const isImportActive =
    isImportPending || importStatus === "queued" || importStatus === "running";

  const importStatusTone =
    importStatus === "failed"
      ? "border-red-200 bg-red-50 text-red-700"
      : importStatus === "success" || importStatus === "partial"
        ? "border-slate-200 bg-[#fcfcfc] text-slate-700"
        : "border-slate-200 bg-[#fcfcfc] text-slate-600";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">Recipes</h1>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
              {workspaceName}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Browse, import, and organize your favorite recipes.
          </p>
        </div>

        <div className="w-full lg:max-w-2xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
                <label className="flex w-full flex-1 flex-col gap-2 text-sm text-slate-600">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Recipe URL
                  </span>
                  <input
                    type="url"
                    value={importUrl}
                    onChange={(event) => {
                      setImportUrl(event.target.value);
                      if (importStatus === "failed") {
                        setImportStatus("idle");
                        setImportMessage(null);
                      }
                    }}
                    placeholder="https://example.com/recipe"
                    disabled={isImportActive}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={isImportActive}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-[#fcfcfc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {isImportPending ? "Starting…" : "Add from URL"}
                </button>
              </div>
              <Link
                href={`/g/${slug}/cook/new`}
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30"
              >
                Add recipe
              </Link>
            </div>

            {importStatusLabel && (
              <div
                className={`mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${importStatusTone}`}
              >
                {isImportActive && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/20 border-t-slate-900" />
                )}
                <span>{importStatusLabel}</span>
              </div>
            )}

            {isImportActive && (
              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-1/3 animate-pulse rounded-full bg-slate-900/40" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap items-end gap-4">
            <label className="flex flex-col gap-2 text-sm text-slate-600">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Search
              </span>
              <input
                type="search"
                placeholder="Search recipes"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                className="min-w-[220px] rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm text-slate-600">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Min rating
              </span>
              <select
                value={currentMinRating}
                onChange={(event) =>
                  updateParams({
                    minRating:
                      event.target.value === "0" ? null : event.target.value,
                  })
                }
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              >
                <option value="0">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5</option>
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm text-slate-600">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Sort
              </span>
              <select
                value={`${currentSort}:${currentDir}`}
                onChange={(event) => handleSortSelect(event.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={currentManualOnly}
                onChange={(event) =>
                  updateParams({ manual: event.target.checked ? "1" : null })
                }
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900/30"
              />
              Manually Added
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleViewChange("table")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                currentView === "table"
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              Table
            </button>
            <button
              type="button"
              onClick={() => handleViewChange("grid")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                currentView === "grid"
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
              }`}
            >
              Grid
            </button>
          </div>
        </div>
      </div>

      {recipes.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl">
            🍲
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">
            No recipes yet
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Add a recipe manually or import one from a URL to get started.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href={`/g/${slug}/cook/new`}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Add recipe
            </Link>
            <button
              type="button"
              onClick={() => {
                const input = document.querySelector<HTMLInputElement>(
                  'input[type="url"]',
                );
                input?.focus();
              }}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              Import from URL
            </button>
          </div>
        </div>
      )}

      {recipes.length > 0 && currentView === "table" && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-white/95 backdrop-blur">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Photo</th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleSort("title")}
                    className="inline-flex items-center gap-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
                  >
                    Title
                    <span className="text-[11px] text-slate-400">
                      {sortIndicator("title")}
                    </span>
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleSort("sourceName")}
                    className="inline-flex items-center gap-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
                  >
                    Source
                    <span className="text-[11px] text-slate-400">
                      {sortIndicator("sourceName")}
                    </span>
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleSort("rating")}
                    className="inline-flex items-center gap-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
                  >
                    Rating
                    <span className="text-[11px] text-slate-400">
                      {sortIndicator("rating")}
                    </span>
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleSort("totalTimeMinutes")}
                    className="inline-flex items-center gap-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
                  >
                    Total time
                    <span className="text-[11px] text-slate-400">
                      {sortIndicator("totalTimeMinutes")}
                    </span>
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleSort("updatedAt")}
                    className="inline-flex items-center gap-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700"
                  >
                    Updated
                    <span className="text-[11px] text-slate-400">
                      {sortIndicator("updatedAt")}
                    </span>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((recipe) => (
                <tr
                  key={recipe.id}
                  className="cursor-pointer border-t border-slate-100 text-slate-700 transition hover:bg-[#fcfcfc]"
                  onClick={() => openRecipe(recipe.id)}
                >
                  <td className="px-4 py-3">{renderTableThumbnail(recipe)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      {recipe.title}
                      {recipe.isPrivate && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                          Private
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatSource(recipe.sourceName, recipe.sourceUrl)}
                  </td>
                  <td className="px-4 py-3">
                    <RatingStars
                      value={recipe.rating ?? 0}
                      onSet={(value) => handleRating(recipe.id, value)}
                      disabled={isRatingPending}
                      stopPropagation
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatMinutes(getTotalMinutes(recipe))}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {formatUpdated(new Date(recipe.updatedAt))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {recipes.length > 0 && currentView === "grid" && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              role="button"
              tabIndex={0}
              className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-sm"
              onClick={() => openRecipe(recipe.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openRecipe(recipe.id);
                }
              }}
            >
              {renderGridImage(recipe)}
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 text-base font-semibold text-slate-900">
                    {recipe.title}
                  </h3>
                  {recipe.isPrivate && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                      Private
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500">
                  {formatSource(recipe.sourceName, recipe.sourceUrl)}
                </p>
                <div className="text-xs text-slate-500">
                  Total time: {formatMinutes(getTotalMinutes(recipe))}
                </div>
                <div className="mt-auto">
                  <RatingStars
                    value={recipe.rating ?? 0}
                    onSet={(value) => handleRating(recipe.id, value)}
                    disabled={isRatingPending}
                    stopPropagation
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedRecipe && currentRecipeId === selectedRecipe.id && !isCookingView && (
        <RecipeOverlay
          slug={slug}
          recipe={selectedRecipe}
          onClose={() => updateParams({ recipeId: null })}
          onOpenCookingView={() => openCookingView(selectedRecipe.id)}
          onSaved={() => router.refresh()}
          onDeleted={() => {
            updateParams({ recipeId: null });
            router.refresh();
          }}
        />
      )}

      {selectedCookingRecipe &&
        currentCookRecipeId === selectedCookingRecipe.id &&
        isCookingView && (
          <CookingViewOverlay
            recipe={selectedCookingRecipe}
            onClose={() => updateParams({ cookRecipeId: null, cookView: null })}
          />
        )}
    </div>
  );
}
