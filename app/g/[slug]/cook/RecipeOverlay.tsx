"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import RatingStars from "./RatingStars";
import { deleteRecipe, updateRecipe } from "./actions";
import type { RecipeDetail, UpdateRecipeInput } from "./types";

const overlayStyles = {
  position: "fixed" as const,
  inset: 0,
  background: "rgba(0, 0, 0, 0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
};

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

  const importMessage = useMemo(() => {
    switch (recipe.importStatus) {
      case "queued":
      case "running":
        return "Importing…";
      case "partial":
        return "Imported partially — please review.";
      case "failed":
        return recipe.importError
          ? `Import failed: ${recipe.importError}`
          : "Import failed — please review.";
      default:
        return null;
    }
  }, [recipe.importError, recipe.importStatus]);

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
    <div style={overlayStyles} onClick={onClose}>
      <div
        style={{
          background: "white",
          width: "min(1000px, 96vw)",
          height: "min(92vh, 900px)",
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #eee",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 18 }}>
            {isEditing ? formState.title : recipe.title}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {!isEditing && (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid #ccc",
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid #ef4444",
                    color: "#ef4444",
                    background: "white",
                  }}
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
                  style={{
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid #0f766e",
                    background: "#0f766e",
                    color: "white",
                  }}
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
                  style={{
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid #ccc",
                  }}
                >
                  Cancel
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            >
              Close
            </button>
          </div>
        </div>

        {importMessage && (
          <div
            style={{
              padding: "10px 20px",
              background: recipe.importStatus === "failed" ? "#fef2f2" : "#f0fdfa",
              color: recipe.importStatus === "failed" ? "#b91c1c" : "#0f766e",
              borderBottom: "1px solid #eee",
              fontSize: 14,
            }}
          >
            {importMessage}
          </div>
        )}

        <div
          style={{
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 20,
            overflowY: "auto",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 20 }}>
            <div style={{ position: "relative" }}>
              {(isEditing ? formState.photoUrl : recipe.photoUrl) ? (
                <img
                  src={isEditing ? formState.photoUrl ?? "" : recipe.photoUrl ?? ""}
                  alt={recipe.title}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  style={{
                    width: "100%",
                    borderRadius: 10,
                    objectFit: "cover",
                    maxHeight: 320,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: 220,
                    borderRadius: 10,
                    background: "#f3f3f3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#777",
                  }}
                >
                  No photo
                </div>
              )}
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setShowPhotoInput((value) => !value)}
                  style={{
                    position: "absolute",
                    right: 12,
                    bottom: 12,
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid #ccc",
                    background: "white",
                  }}
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
                  style={{
                    width: "100%",
                    marginTop: 12,
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: "1px solid #ccc",
                  }}
                />
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
                  style={{
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #ccc",
                    fontSize: 18,
                    fontWeight: 600,
                  }}
                />
              ) : (
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  {recipe.title}
                </div>
              )}

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
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
                      style={{
                        flex: 1,
                        minWidth: 160,
                        padding: "8px 10px",
                        borderRadius: 6,
                        border: "1px solid #ccc",
                      }}
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
                      style={{
                        flex: 1,
                        minWidth: 160,
                        padding: "8px 10px",
                        borderRadius: 6,
                        border: "1px solid #ccc",
                      }}
                    />
                  </>
                ) : (
                  <div style={{ color: "#555" }}>
                    {recipe.sourceUrl ? (
                      <a
                        href={recipe.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#0f766e" }}
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
                  style={{
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: "1px solid #ccc",
                  }}
                />
              ) : (
                <div style={{ color: "#555" }}>
                  {recipe.description || "No description."}
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: 12,
                }}
              >
                {isEditing ? (
                  <>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 12, color: "#555" }}>Prep (min)</span>
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
                        style={{
                          padding: "8px 10px",
                          borderRadius: 6,
                          border: "1px solid #ccc",
                        }}
                      />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 12, color: "#555" }}>Cook (min)</span>
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
                        style={{
                          padding: "8px 10px",
                          borderRadius: 6,
                          border: "1px solid #ccc",
                        }}
                      />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 12, color: "#555" }}>Total (min)</span>
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
                        style={{
                          padding: "8px 10px",
                          borderRadius: 6,
                          border: "1px solid #ccc",
                        }}
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <div style={{ color: "#555" }}>
                      Prep: {formatMinutes(recipe.prepTimeMinutes)}
                    </div>
                    <div style={{ color: "#555" }}>
                      Cook: {formatMinutes(recipe.cookTimeMinutes)}
                    </div>
                    <div style={{ color: "#555" }}>
                      Total: {formatMinutes(recipe.totalTimeMinutes)}
                    </div>
                  </>
                )}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
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
                      style={{
                        flex: 1,
                        minWidth: 120,
                        padding: "8px 10px",
                        borderRadius: 6,
                        border: "1px solid #ccc",
                      }}
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
                      style={{
                        flex: 1,
                        minWidth: 120,
                        padding: "8px 10px",
                        borderRadius: 6,
                        border: "1px solid #ccc",
                      }}
                    />
                  </>
                ) : (
                  <>
                    <div style={{ color: "#555" }}>
                      Servings: {recipe.servings || "—"}
                    </div>
                    <div style={{ color: "#555" }}>Yields: {recipe.yields || "—"}</div>
                  </>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: "#555" }}>Rating:</span>
                {isEditing ? (
                  <RatingStars
                    value={formState.rating ?? 0}
                    onSet={(value) =>
                      setFormState((prev) => ({ ...prev, rating: value }))
                    }
                    stopPropagation
                  />
                ) : (
                  <RatingStars
                    value={recipe.rating ?? 0}
                    onSet={() => undefined}
                    disabled
                  />
                )}
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                    />
                    Private recipe
                  </>
                ) : (
                  <div style={{ color: "#555" }}>
                    Privacy: {recipe.isPrivate ? "Private" : "Shared"}
                  </div>
                )}
              </label>

              <div style={{ fontSize: 12, color: "#777" }}>
                Updated {formatDate(recipe.updatedAt)} · Created {formatDate(recipe.createdAt)}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <h3 style={{ marginTop: 0 }}>Ingredients</h3>
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
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: "1px solid #ccc",
                  }}
                />
              ) : (
                <ul style={{ paddingLeft: 18, color: "#555" }}>
                  {recipe.ingredientLines.length > 0 ? (
                    recipe.ingredientLines
                      .slice()
                      .sort((a, b) => a.position - b.position)
                      .map((line) => (
                        <li key={line.id}>{line.ingredient}</li>
                      ))
                  ) : (
                    <li>No ingredients listed.</li>
                  )}
                </ul>
              )}
            </div>

            <div>
              <h3 style={{ marginTop: 0 }}>Directions</h3>
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
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: "1px solid #ccc",
                  }}
                />
              ) : (
                <div style={{ whiteSpace: "pre-line", color: "#555" }}>
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
