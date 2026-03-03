"use client";

import { useMemo, useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  buildShoppingView,
  getCategoryOrder,
  type CategoryView,
  type WeekList,
} from "@/lib/ingredientParsing";
import type { SmartListData } from "@/lib/smartListTypes";
import WhatsAppShareButton from "@/app/_components/WhatsAppShareButton";
import { buildWhatsAppShareUrl, openInNewTab } from "@/lib/whatsapp";

const SMART_LIST_READY_HIGHLIGHT_CLASS = "bg-slate-200";
const INGREDIENT_ACTIVE_CARD_CLASS =
  `${SMART_LIST_READY_HIGHLIGHT_CLASS} border-slate-300 text-slate-900`;

type ShopClientProps = {
  workspaceId: string;
  workspaceName: string;
  weekLists: WeekList[];
};

function CategorySection({
  category,
  hoverIngredientIds,
  effectiveSelectedIngredientIds,
  checkedItems,
  toggleItem,
  toggleIngredientSelected,
}: {
  category: CategoryView;
  hoverIngredientIds: Set<string>;
  effectiveSelectedIngredientIds: Set<string>;
  checkedItems: Set<string>;
  toggleItem: (key: string) => void;
  toggleIngredientSelected: (id: string) => void;
}) {
  if (category.items.length === 0) return null;
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">{category.label}</h3>
      <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {category.items.map((item) => {
          const isSelectedIngredient = effectiveSelectedIngredientIds.has(item.id);
          const isHoverHighlighted =
            !isSelectedIngredient && hoverIngredientIds.has(item.id);
          const isChecked = checkedItems.has(item.id);
          return (
            <li
              key={item.id}
              onClick={() => toggleIngredientSelected(item.id)}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors duration-150 ${
                isSelectedIngredient
                  ? INGREDIENT_ACTIVE_CARD_CLASS
                  : isHoverHighlighted
                    ? INGREDIENT_ACTIVE_CARD_CLASS
                    : "bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onClick={(event) => event.stopPropagation()}
                onChange={() => toggleItem(item.id)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <span className="flex-1">{item.display}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const SMART_CATEGORY_EMOJI: Record<string, string> = {
  "fresh produce (fruit, veg, fresh herbs)": "🥕🥦🍎",
  "meat & seafood": "🥩🐟🍤",
  "dairy, eggs, cheese & fridge": "🥛🥚🧀",
  "dry herbs & spices": "🌿🧂🌶️",
  "condiments & sauces": "🍅🫙🥫",
  "pasta & grains": "🍝🌾🍚",
  "oils & vinegars": "🫒🍶🍾",
  "flours, bakery & sugars": "🍞🌾🍬",
  "pantry (biscuits, tins, other)": "🥫🍪📦",
  frozen: "🧊",
  other: "📦🔧✨",
};

function getSmartCategoryEmoji(label: string) {
  const key = label.trim().toLowerCase();
  return SMART_CATEGORY_EMOJI[key] ?? "🍽️";
}

function normalizeShareUrl(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (/^www\./i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function getRecipeShareSourceUrl(recipe: WeekList["recipes"][number]) {
  const recipeRecord = recipe as Record<string, unknown>;
  const candidates = [
    recipe.sourceUrl,
    typeof recipeRecord.url === "string" ? recipeRecord.url : null,
    typeof recipeRecord.originalUrl === "string" ? recipeRecord.originalUrl : null,
    recipe.importUrl,
  ];
  for (const candidate of candidates) {
    const normalized = normalizeShareUrl(candidate);
    if (normalized) return normalized;
  }
  return null;
}

export default function ShopClient({
  workspaceId,
  workspaceName,
  weekLists,
}: ShopClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [hoveredRecipeId, setHoveredRecipeId] = useState<string | null>(null);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<Set<string>>(new Set());
  const [manuallyDeselectedRecipeIds, setManuallyDeselectedRecipeIds] = useState<Set<string>>(
    new Set(),
  );
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<Set<string>>(
    new Set(),
  );
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"aggregated" | "smart">("aggregated");
  const [hasManualViewSelection, setHasManualViewSelection] = useState(false);
  const [smartListByWeek, setSmartListByWeek] = useState<
    Record<string, SmartListData | null>
  >({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const weekParam = searchParams.get("week");
  const weekStarts = weekLists.map((week) => week.weekStart);
  const defaultWeek = weekStarts[0] ?? null;
  const selectedWeekStart =
    weekParam && weekStarts.includes(weekParam) ? weekParam : defaultWeek;

  useEffect(() => {
    if (!weekParam && defaultWeek) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("week", defaultWeek);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [weekParam, defaultWeek, pathname, router, searchParams]);

  const selectedWeek = weekLists.find(
    (week) => week.weekStart === selectedWeekStart
  );

  const categoryViews = useMemo(
    () => buildShoppingView(selectedWeek ?? null, { aggregate: true, metric: false }),
    [selectedWeek]
  );

  const categoriesInOrder = useMemo(() => {
    const order = getCategoryOrder();
    const map = new Map(categoryViews.map((category) => [category.key, category]));
    return order.map(({ key }) => map.get(key)).filter(Boolean) as CategoryView[];
  }, [categoryViews]);

  const handleSelectWeek = (weekStart: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", weekStart);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const toggleItem = (key: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const onRecipeHoverStart = (id: string) => setHoveredRecipeId(id);
  const onRecipeHoverEnd = () => setHoveredRecipeId(null);

  const toggleRecipeSelected = (id: string) => {
    const isDirectlySelected = selectedRecipeIds.has(id);

    if (isDirectlySelected) {
      setSelectedRecipeIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setManuallyDeselectedRecipeIds((prev) => new Set(prev).add(id));
      return;
    }

    setSelectedRecipeIds((prev) => new Set(prev).add(id));
    setManuallyDeselectedRecipeIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleIngredientSelected = (id: string) => {
    setSelectedIngredientIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  useEffect(() => {
    const nextMap: Record<string, SmartListData | null> = {};
    weekLists.forEach((week) => {
      if (week.weekId) {
        nextMap[week.weekId] = week.smartList ?? null;
      }
    });
    setSmartListByWeek(nextMap);
  }, [weekLists]);

  useEffect(() => {
    if (!selectedWeek?.weekId) return;
    const smartList = smartListByWeek[selectedWeek.weekId];
    if (!smartList && viewMode === "smart") {
      setViewMode("aggregated");
    }
  }, [selectedWeek?.weekId, smartListByWeek, viewMode]);

  useEffect(() => {
    setHasManualViewSelection(false);
  }, [selectedWeek?.weekId]);

  const currentSmartList = selectedWeek?.weekId
    ? smartListByWeek[selectedWeek.weekId] ?? null
    : null;
  const smartListReady =
    !!currentSmartList &&
    !!selectedWeek?.version &&
    currentSmartList.version === selectedWeek.version;
  const smartListOutdated =
    !!currentSmartList &&
    !!selectedWeek?.version &&
    currentSmartList.version < selectedWeek.version;

  useEffect(() => {
    if (currentSmartList && !hasManualViewSelection && viewMode !== "smart") {
      setViewMode("smart");
    }
  }, [currentSmartList, hasManualViewSelection, viewMode]);

  useEffect(() => {
    setErrorMessage(null);
  }, [selectedWeek?.weekId]);

  useEffect(() => {
    setHoveredRecipeId(null);
    setSelectedRecipeIds(new Set());
    setManuallyDeselectedRecipeIds(new Set());
    setSelectedIngredientIds(new Set());
  }, [selectedWeek?.weekId, viewMode]);

  const currentIngredients = useMemo(() => {
    if (viewMode === "aggregated") {
      return categoriesInOrder.flatMap((category) =>
        category.items.map((item) => ({
          ingredientId: item.id,
          recipeIds: item.recipeIds,
        })),
      );
    }

    return currentSmartList
      ? currentSmartList.categories.flatMap((category) =>
          category.items.map((item) => ({
            ingredientId: item.id,
            recipeIds: item.provenance
              .map((source) => source.sourceRecipeId)
              .filter((id): id is string => Boolean(id)),
          })),
        )
      : [];
  }, [categoriesInOrder, currentSmartList, viewMode]);

  const { recipeToIngredientIds, ingredientToRecipeIds } = useMemo(() => {
    const nextRecipeToIngredientIds = new Map<string, Set<string>>();
    const nextIngredientToRecipeIds = new Map<string, Set<string>>();

    currentIngredients.forEach(({ ingredientId, recipeIds }) => {
      if (!nextIngredientToRecipeIds.has(ingredientId)) {
        nextIngredientToRecipeIds.set(ingredientId, new Set());
      }
      const recipeIdSet = nextIngredientToRecipeIds.get(ingredientId);
      recipeIds.forEach((recipeId) => {
        recipeIdSet?.add(recipeId);
        if (!nextRecipeToIngredientIds.has(recipeId)) {
          nextRecipeToIngredientIds.set(recipeId, new Set());
        }
        nextRecipeToIngredientIds.get(recipeId)?.add(ingredientId);
      });
    });

    return {
      recipeToIngredientIds: nextRecipeToIngredientIds,
      ingredientToRecipeIds: nextIngredientToRecipeIds,
    };
  }, [currentIngredients]);

  const hoverIngredientIds = useMemo(() => {
    if (!hoveredRecipeId) return new Set<string>();
    return recipeToIngredientIds.get(hoveredRecipeId) ?? new Set<string>();
  }, [hoveredRecipeId, recipeToIngredientIds]);

  const selectedIngredientIdsFromRecipes = useMemo(() => {
    const ids = new Set<string>();
    selectedRecipeIds.forEach((recipeId) => {
      recipeToIngredientIds.get(recipeId)?.forEach((ingredientId) => {
        ids.add(ingredientId);
      });
    });
    return ids;
  }, [selectedRecipeIds, recipeToIngredientIds]);

  const selectedRecipeIdsFromIngredients = useMemo(() => {
    const ids = new Set<string>();
    selectedIngredientIds.forEach((ingredientId) => {
      ingredientToRecipeIds.get(ingredientId)?.forEach((recipeId) => {
        ids.add(recipeId);
      });
    });
    return ids;
  }, [selectedIngredientIds, ingredientToRecipeIds]);

  const effectiveSelectedIngredientIds = useMemo(
    () => new Set([...selectedIngredientIds, ...selectedIngredientIdsFromRecipes]),
    [selectedIngredientIds, selectedIngredientIdsFromRecipes],
  );

  const hasShareableMeals = Boolean(selectedWeek && selectedWeek.recipes.length > 0);
  const shareError = selectedWeek && !hasShareableMeals ? "No planned meals to share." : null;

  const handleWhatsAppShare = () => {
    if (!selectedWeek || selectedWeek.recipes.length === 0) return;
    const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      timeZone: "UTC",
    });
    const mealLines = selectedWeek.recipes.flatMap((recipe) => {
      const dayShort = weekdayFormatter
        .format(new Date(`${recipe.dateISO}T00:00:00Z`))
        .replace(".", "");
      const sourceUrl = getRecipeShareSourceUrl(recipe);
      return [`${dayShort}: ${recipe.title}`, `Source: ${sourceUrl ?? "(no source link)"}`];
    });
    const message = ["Here are this week’s dinners 🍽️", "", ...mealLines].join("\n").trim();
    openInNewTab(buildWhatsAppShareUrl(message));
  };

  const handleGenerateSmartList = async () => {
    if (!selectedWeek?.weekId || isGenerating || smartListReady) return;
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/smart-lists/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          weekId: selectedWeek.weekId,
          shoppingListId: selectedWeek.weekId,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Couldn’t generate smart list.");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Couldn’t generate smart list.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 lg:flex-row">
      <section className="flex w-full flex-col lg:w-[30%]">
        <div className="flex h-[70vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white lg:h-[calc(100vh-180px)]">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Weekly lists
            </h2>
            <p className="text-xs text-slate-500">
              Weekly lists for {workspaceName} • Upcoming weeks
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {weekLists.length === 0 ? (
              <p className="text-sm text-slate-500">
                No planned recipes yet. Add meals to your plan to start a list.
              </p>
            ) : (
              <div className="space-y-3">
                {weekLists.map((week) => {
                  const isSelected = week.weekStart === selectedWeekStart;
                  return (
                    <div
                      key={week.weekStart}
                      className={`rounded-xl border p-3 transition ${
                        isSelected
                          ? "border-slate-300 bg-[#fcfcfc] text-slate-900"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-[#fcfcfc]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectWeek(week.weekStart)}
                        className="w-full text-left"
                      >
                        <p className="text-sm font-semibold">{week.title}</p>
                        <p
                          className={`mt-1 text-xs ${
                            isSelected ? "text-slate-600" : "text-slate-500"
                          }`}
                        >
                          {week.recipes.length} planned meal
                          {week.recipes.length === 1 ? "" : "s"}
                        </p>
                      </button>
                      {isSelected ? (
                        <div className="mt-3 space-y-2">
                          {week.recipes.map((recipe, index) => {
                            const isSelectedRecipe =
                              selectedRecipeIds.has(recipe.id) ||
                              (selectedRecipeIdsFromIngredients.has(recipe.id) &&
                                !manuallyDeselectedRecipeIds.has(recipe.id));

                            return (
                            <div
                              key={`${recipe.id}-${index}`}
                              onMouseEnter={() => onRecipeHoverStart(recipe.id)}
                              onMouseLeave={onRecipeHoverEnd}
                              onClick={() => toggleRecipeSelected(recipe.id)}
                              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2 py-1 text-xs transition-colors duration-150 ${
                                isSelectedRecipe
                                  ? "border-black bg-black text-white"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-[#fcfcfc]"
                              }`}
                            >
                              {recipe.photoUrl ? (
                                <img
                                  src={recipe.photoUrl}
                                  alt=""
                                  className="h-7 w-7 rounded-md object-cover"
                                />
                              ) : (
                                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-200 text-[10px] font-semibold text-slate-500">
                                  —
                                </div>
                              )}
                              <span className="flex-1">{recipe.title}</span>
                            </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="flex w-full flex-col lg:w-[70%]">
        <div className="flex h-[70vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white lg:h-[calc(100vh-180px)]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                {selectedWeek ? selectedWeek.title : "Shopping List"}
              </h2>
              <p className="text-xs text-slate-500">
                {selectedWeek
                  ? "Hover a recipe to highlight its ingredients."
                  : "Select a week to see ingredients."}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center rounded-full border border-slate-200 bg-[#fcfcfc] p-1 text-xs font-medium text-slate-600">
                  <button
                    type="button"
                    onClick={() => {
                      setHasManualViewSelection(true);
                      setViewMode("aggregated");
                    }}
                    className={`rounded-full px-3 py-1 transition ${
                      viewMode === "aggregated"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    Aggregated
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHasManualViewSelection(true);
                      setViewMode("smart");
                    }}
                    disabled={!currentSmartList}
                    className={`rounded-full px-3 py-1 transition ${
                      viewMode === "smart"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    } ${!currentSmartList ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    Smart List
                  </button>
                </div>
                {smartListOutdated ? (
                  <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                    Out of date
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={handleGenerateSmartList}
                  disabled={!selectedWeek || smartListReady || isGenerating}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition ${
                    smartListReady || !selectedWeek
                      ? `cursor-not-allowed ${SMART_LIST_READY_HIGHLIGHT_CLASS} text-slate-700`
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  {isGenerating ? (
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : null}
                  <span className="flex h-4 w-4 items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="h-4 w-4 fill-current"
                    >
                      <path d="M12 2l1.4 4.2L18 7.6l-4.2 1.4L12 13.2l-1.4-4.2L6.4 7.6l4.2-1.4L12 2zm7 10l.9 2.7 2.7.9-2.7.9L19 19l-.9-2.7-2.7-.9 2.7-.9L19 12zm-14 1l.9 2.7 2.7.9-2.7.9L5 20l-.9-2.7-2.7-.9 2.7-.9L5 13z" />
                    </svg>
                  </span>
                  {smartListReady
                    ? "Smart List Ready"
                    : isGenerating
                    ? "Generating..."
                    : "Generate Smart List"}
                </button>
                <WhatsAppShareButton
                  label="Share via WhatsApp"
                  onClick={handleWhatsAppShare}
                  disabled={!hasShareableMeals}
                />
              </div>
              {shareError ? (
                <p className="text-[11px] font-semibold text-rose-500">{shareError}</p>
              ) : null}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {selectedWeek ? (
              <div className="space-y-8">
                {errorMessage ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                    Couldn’t generate smart list. Try again.
                  </div>
                ) : null}
                {viewMode === "aggregated" ? (
                  categoriesInOrder.map((category) => (
                    <CategorySection
                      key={category.key}
                      category={category}
                      hoverIngredientIds={hoverIngredientIds}
                      effectiveSelectedIngredientIds={effectiveSelectedIngredientIds}
                      checkedItems={checkedItems}
                      toggleItem={toggleItem}
                      toggleIngredientSelected={toggleIngredientSelected}
                    />
                  ))
                ) : currentSmartList ? (
                  currentSmartList.categories.map((category) => (
                    <section key={category.name} className="space-y-3">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <span aria-hidden="true">
                          {getSmartCategoryEmoji(category.name)}
                        </span>
                        {category.name}
                      </h3>
                      <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {category.items.map((item) => {
                          const isChecked = checkedItems.has(item.id);
                          const isSelectedIngredient =
                            selectedIngredientIds.has(item.id) ||
                            selectedIngredientIdsFromRecipes.has(item.id);
                          const isHoverHighlighted =
                            !isSelectedIngredient && hoverIngredientIds.has(item.id);
                          return (
                            <li
                              key={item.id}
                              onClick={() => toggleIngredientSelected(item.id)}
                              className={`flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors duration-150 ${
                                isSelectedIngredient
                                  ? INGREDIENT_ACTIVE_CARD_CLASS
                                  : isHoverHighlighted
                                    ? INGREDIENT_ACTIVE_CARD_CLASS
                                    : "bg-white text-slate-700 hover:border-slate-300"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onClick={(event) => event.stopPropagation()}
                                onChange={() => toggleItem(item.id)}
                                className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                              />
                              <div className="flex-1 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium text-slate-800">
                                    {item.displayText}
                                  </span>
                                  {item.isEstimated ? (
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                                      Estimated
                                    </span>
                                  ) : null}
                                  {item.isMerged ? (
                                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                                      Merged
                                    </span>
                                  ) : null}
                                </div>
                                {item.provenance.length > 0 ? (
                                  <details className="group relative text-xs text-slate-500">
                                    <summary className="cursor-pointer select-none text-xs font-medium text-slate-500">
                                      Derived from {item.provenance.length} item
                                      {item.provenance.length === 1 ? "" : "s"}
                                    </summary>
                                    <div className="mt-2 rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-600 shadow-md">
                                      <ul className="space-y-1">
                                        {item.provenance.map((source) => (
                                          <li key={source.id} className="leading-snug">
                                            {source.sourceText}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </details>
                                ) : null}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    Generate a smart list to see normalized items.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Select a week from the left panel to see ingredients.
              </p>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
