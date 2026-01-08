"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import RatingStars from "./RatingStars";
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
  recipes: RecipeItem[];
  view: ViewMode;
  q: string;
  minRating: number;
  hasPhoto: boolean;
  privateOnly: boolean;
  sort: SortField;
  dir: SortDirection;
  selectedRecipe: RecipeDetail | null;
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
  recipes,
  view,
  q,
  minRating,
  hasPhoto,
  privateOnly,
  sort,
  dir,
  selectedRecipe,
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
  const currentMinRating = (() => {
    const raw = currentParams.get("minRating");
    const parsed = Number(raw ?? minRating);
    return Number.isNaN(parsed) ? minRating : parsed;
  })();
  const currentHasPhoto = currentParams.get("hasPhoto")
    ? currentParams.get("hasPhoto") === "1"
    : hasPhoto;
  const currentPrivateOnly = currentParams.get("private")
    ? currentParams.get("private") === "1"
    : privateOnly;
  const currentRecipeId = currentParams.get("recipeId") ?? selectedRecipe?.id ?? null;

  const [searchText, setSearchText] = useState(currentParams.get("q") ?? q);

  useEffect(() => {
    setSearchText(currentParams.get("q") ?? q);
  }, [currentParams, q]);

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
    updateParams({ recipeId });
  };

  const renderThumbnail = (recipe: RecipeItem) => {
    if (recipe.photoUrl) {
      return (
        <img
          src={recipe.photoUrl}
          alt={recipe.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          style={{
            width: 64,
            height: 64,
            borderRadius: 8,
            objectFit: "cover",
            display: "block",
            background: "#f3f3f3",
          }}
        />
      );
    }

    return (
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 8,
          background: "#f3f3f3",
          color: "#777",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          textAlign: "center",
          padding: 4,
        }}
      >
        No photo
      </div>
    );
  };

  const sortIndicator = (field: SortField) => {
    if (currentSort !== field) return "";
    return currentDir === "asc" ? " ▲" : " ▼";
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

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "flex-end",
          marginBottom: 16,
          background: "#fff",
          border: "1px solid #eee",
          borderRadius: 8,
          padding: 12,
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 12, color: "#555" }}>Recipe URL</span>
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
            style={{
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #ccc",
              minWidth: 260,
            }}
          />
        </label>
        <button
          type="button"
          onClick={handleImport}
          disabled={isImportPending || importStatus === "queued" || importStatus === "running"}
          style={{
            padding: "9px 14px",
            borderRadius: 6,
            border: "1px solid #0f766e",
            background: "#0f766e",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {isImportPending ? "Starting…" : "Add from URL"}
        </button>
        {importStatusLabel && (
          <span style={{ fontSize: 13, color: importStatus === "failed" ? "#b91c1c" : "#555" }}>
            {importStatusLabel}
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          background: "#fafafa",
          padding: 12,
          borderRadius: 8,
          border: "1px solid #eee",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "#555" }}>Search</span>
            <input
              type="search"
              placeholder="Search recipes"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              style={{
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #ccc",
                minWidth: 220,
              }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "#555" }}>Min rating</span>
            <select
              value={currentMinRating}
              onChange={(event) =>
                updateParams({
                  minRating:
                    event.target.value === "0" ? null : event.target.value,
                })
              }
              style={{
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            >
              <option value="0">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
              <option value="5">5</option>
            </select>
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 18,
              fontSize: 14,
            }}
          >
            <input
              type="checkbox"
              checked={currentHasPhoto}
              onChange={(event) =>
                updateParams({ hasPhoto: event.target.checked ? "1" : null })
              }
            />
            Has photo
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 18,
              fontSize: 14,
            }}
          >
            <input
              type="checkbox"
              checked={currentPrivateOnly}
              onChange={(event) =>
                updateParams({ private: event.target.checked ? "1" : null })
              }
            />
            Private only
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 12, color: "#555" }}>Sort</span>
            <select
              value={`${currentSort}:${currentDir}`}
              onChange={(event) => handleSortSelect(event.target.value)}
              style={{
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => updateParams({ view: "table" })}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #ccc",
              background: currentView === "table" ? "#0f766e" : "white",
              color: currentView === "table" ? "white" : "#333",
            }}
          >
            Table
          </button>
          <button
            type="button"
            onClick={() => updateParams({ view: "grid" })}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #ccc",
              background: currentView === "grid" ? "#0f766e" : "white",
              color: currentView === "grid" ? "white" : "#333",
            }}
          >
            Grid
          </button>
        </div>
      </div>

      {recipes.length === 0 && (
        <div
          style={{
            padding: 16,
            color: "#555",
            border: "1px solid #eee",
            borderRadius: 8,
          }}
        >
          No recipes yet. <Link href={`/g/${slug}/cook/new`}>Add your first one.</Link>
        </div>
      )}

      {recipes.length > 0 && currentView === "table" && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                <th style={{ padding: "10px 6px" }}>Photo</th>
                <th style={{ padding: "10px 6px" }}>
                  <button
                    type="button"
                    onClick={() => handleSort("title")}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Title{sortIndicator("title")}
                  </button>
                </th>
                <th style={{ padding: "10px 6px" }}>
                  <button
                    type="button"
                    onClick={() => handleSort("sourceName")}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Source{sortIndicator("sourceName")}
                  </button>
                </th>
                <th style={{ padding: "10px 6px" }}>
                  <button
                    type="button"
                    onClick={() => handleSort("rating")}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Rating{sortIndicator("rating")}
                  </button>
                </th>
                <th style={{ padding: "10px 6px" }}>
                  <button
                    type="button"
                    onClick={() => handleSort("totalTimeMinutes")}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Total time{sortIndicator("totalTimeMinutes")}
                  </button>
                </th>
                <th style={{ padding: "10px 6px" }}>
                  <button
                    type="button"
                    onClick={() => handleSort("updatedAt")}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Updated{sortIndicator("updatedAt")}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {recipes.map((recipe) => (
                <tr
                  key={recipe.id}
                  style={{ borderBottom: "1px solid #eee", cursor: "pointer" }}
                  onClick={() => openRecipe(recipe.id)}
                >
                  <td style={{ padding: "10px 6px" }}>{renderThumbnail(recipe)}</td>
                  <td style={{ padding: "10px 6px", fontWeight: 600 }}>
                    {recipe.title}
                    {recipe.isPrivate && (
                      <span
                        style={{
                          marginLeft: 8,
                          padding: "2px 6px",
                          fontSize: 11,
                          borderRadius: 12,
                          background: "#fef3c7",
                          color: "#92400e",
                        }}
                      >
                        Private
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "10px 6px", color: "#333" }}>
                    {formatSource(recipe.sourceName, recipe.sourceUrl)}
                  </td>
                  <td style={{ padding: "10px 6px" }}>
                    <RatingStars
                      value={recipe.rating ?? 0}
                      onSet={(value) => handleRating(recipe.id, value)}
                      disabled={isRatingPending}
                      stopPropagation
                    />
                  </td>
                  <td style={{ padding: "10px 6px" }}>
                    {formatMinutes(getTotalMinutes(recipe))}
                  </td>
                  <td style={{ padding: "10px 6px", color: "#555" }}>
                    {formatUpdated(new Date(recipe.updatedAt))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {recipes.length > 0 && currentView === "grid" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              style={{
                border: "1px solid #eee",
                borderRadius: 12,
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                background: "white",
                cursor: "pointer",
              }}
              onClick={() => openRecipe(recipe.id)}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {renderThumbnail(recipe)}
                {recipe.isPrivate && (
                  <span
                    style={{
                      padding: "2px 6px",
                      fontSize: 11,
                      borderRadius: 12,
                      background: "#fef3c7",
                      color: "#92400e",
                      height: "fit-content",
                    }}
                  >
                    Private
                  </span>
                )}
              </div>
              <div style={{ fontWeight: 600 }}>{recipe.title}</div>
              <div style={{ color: "#555", fontSize: 13 }}>
                {formatSource(recipe.sourceName, recipe.sourceUrl)}
              </div>
              <div style={{ fontSize: 13, color: "#555" }}>
                Total time: {formatMinutes(getTotalMinutes(recipe))}
              </div>
              <RatingStars
                value={recipe.rating ?? 0}
                onSet={(value) => handleRating(recipe.id, value)}
                disabled={isRatingPending}
                stopPropagation
              />
            </div>
          ))}
        </div>
      )}

      {selectedRecipe && currentRecipeId === selectedRecipe.id && (
        <RecipeOverlay
          slug={slug}
          recipe={selectedRecipe}
          onClose={() => updateParams({ recipeId: null })}
          onSaved={() => router.refresh()}
          onDeleted={() => {
            updateParams({ recipeId: null });
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
