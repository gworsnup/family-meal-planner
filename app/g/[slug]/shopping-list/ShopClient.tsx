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
import { generateSmartList } from "./actions";
import WhatsAppShareButton from "@/app/_components/WhatsAppShareButton";

type ShopClientProps = {
  workspaceSlug: string;
  workspaceName: string;
  weekLists: WeekList[];
};

function CategorySection({
  category,
  hoverRecipeId,
  checkedItems,
  toggleItem,
}: {
  category: CategoryView;
  hoverRecipeId: string | null;
  checkedItems: Set<string>;
  toggleItem: (key: string) => void;
}) {
  if (category.items.length === 0) return null;
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">{category.label}</h3>
      <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {category.items.map((item) => {
          const isHighlighted =
            hoverRecipeId && item.recipeIds.includes(hoverRecipeId);
          const isChecked = checkedItems.has(item.id);
          return (
            <li
              key={item.id}
              className={`flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition ${
                isHighlighted
                  ? "border-slate-300 bg-[#fcfcfc]"
                  : "bg-white hover:border-slate-300"
              }`}
            >
              <input
                type="checkbox"
                checked={isChecked}
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
  produce: "🥦",
  fruit: "🍎",
  fruits: "🍎",
  vegetables: "🥕",
  veggie: "🥕",
  veggies: "🥕",
  dairy: "🧀",
  meat: "🥩",
  seafood: "🐟",
  bakery: "🥖",
  pantry: "🥫",
  frozen: "🧊",
  beverages: "🥤",
  snacks: "🍿",
  spices: "🧂",
  grains: "🌾",
  pasta: "🍝",
  condiments: "🍯",
  canned: "🥫",
};

function getSmartCategoryEmoji(label: string) {
  const key = label.trim().toLowerCase();
  return SMART_CATEGORY_EMOJI[key] ?? "🍽️";
}

export default function ShopClient({
  workspaceSlug,
  workspaceName,
  weekLists,
}: ShopClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [hoverRecipeId, setHoverRecipeId] = useState<string | null>(null);
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

  useEffect(() => {
    setErrorMessage(null);
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

  const handleGenerateSmartList = async () => {
    if (!selectedWeek?.weekId || isGenerating || smartListReady) return;
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const result = await generateSmartList({
        slug: workspaceSlug,
        weekId: selectedWeek.weekId,
      });
      setSmartListByWeek((prev) => ({
        ...prev,
        [selectedWeek.weekId as string]: result.smartList,
      }));
      setViewMode("smart");
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
                          {week.recipes.map((recipe, index) => (
                            <div
                              key={`${recipe.id}-${index}`}
                              onMouseEnter={() => setHoverRecipeId(recipe.id)}
                              onMouseLeave={() => setHoverRecipeId(null)}
                              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 transition hover:border-slate-300 hover:bg-[#fcfcfc]"
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
                          ))}
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
                    ? "cursor-not-allowed bg-slate-200 text-slate-500"
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
              <WhatsAppShareButton label="Share via WhatsApp" />
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
                {isGenerating ? (
                  <div className="rounded-xl border border-slate-200 bg-[#fcfcfc] px-3 py-3 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400/40 border-t-slate-600" />
                      Generating smart list…
                    </div>
                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full w-1/2 animate-pulse rounded-full bg-slate-400" />
                    </div>
                  </div>
                ) : null}
                {viewMode === "aggregated" ? (
                  categoriesInOrder.map((category) => (
                    <CategorySection
                      key={category.key}
                      category={category}
                      hoverRecipeId={hoverRecipeId}
                      checkedItems={checkedItems}
                      toggleItem={toggleItem}
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
                          return (
                            <li
                              key={item.id}
                              className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
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
