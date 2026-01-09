"use client";

import { useMemo, useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  buildShoppingView,
  getCategoryOrder,
  type CategoryView,
  type WeekList,
} from "@/lib/ingredientParsing";

type ShopClientProps = {
  slug: string;
  weekLists: WeekList[];
};

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
      />
      {label}
    </label>
  );
}

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
      <ul className="space-y-2">
        {category.items.map((item) => {
          const isHighlighted =
            hoverRecipeId && item.recipeIds.includes(hoverRecipeId);
          const isChecked = checkedItems.has(item.id);
          return (
            <li
              key={item.id}
              className={`flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition ${
                isHighlighted
                  ? "border-slate-300 bg-slate-100"
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

function CategorySectionByRecipe({
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
  if (!category.recipes || category.recipes.length === 0) return null;
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900">{category.label}</h3>
      <div className="space-y-4">
        {category.recipes.map((recipe) => (
          <div key={recipe.id} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {recipe.title}
            </p>
            <ul className="space-y-2">
              {recipe.items.map((item) => {
                const key = `${recipe.id}-${item.id}`;
                const isHighlighted =
                  hoverRecipeId && item.recipeIds.includes(hoverRecipeId);
                const isChecked = checkedItems.has(key);
                return (
                  <li
                    key={key}
                    className={`flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition ${
                      isHighlighted
                        ? "border-slate-300 bg-slate-100"
                        : "bg-white hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleItem(key)}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span className="flex-1">{item.display}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ShopClient({ slug, weekLists }: ShopClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [aggregate, setAggregate] = useState(true);
  const [metric, setMetric] = useState(false);
  const [hoverRecipeId, setHoverRecipeId] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

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
    () => buildShoppingView(selectedWeek ?? null, { aggregate, metric }),
    [selectedWeek, aggregate, metric]
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

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 lg:flex-row">
      <section className="flex w-full flex-col lg:w-[30%]">
        <div className="flex h-[70vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:h-[calc(100vh-180px)]">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Weekly lists
            </h2>
            <p className="text-xs text-slate-500">
              {slug.toUpperCase()} • Upcoming weeks
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
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
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
                            isSelected ? "text-slate-200" : "text-slate-500"
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
                              className="rounded-lg border border-white/20 px-2 py-1 text-xs text-white/90 transition hover:bg-white/10"
                            >
                              {recipe.title}
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
        <div className="flex h-[70vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:h-[calc(100vh-180px)]">
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
            <div className="flex items-center gap-4">
              <Toggle
                label="Aggregate"
                checked={aggregate}
                onChange={setAggregate}
              />
              <Toggle
                label="Convert to metric"
                checked={metric}
                onChange={setMetric}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {selectedWeek ? (
              <div className="space-y-8">
                {categoriesInOrder.map((category) =>
                  aggregate ? (
                    <CategorySection
                      key={category.key}
                      category={category}
                      hoverRecipeId={hoverRecipeId}
                      checkedItems={checkedItems}
                      toggleItem={toggleItem}
                    />
                  ) : (
                    <CategorySectionByRecipe
                      key={category.key}
                      category={category}
                      hoverRecipeId={hoverRecipeId}
                      checkedItems={checkedItems}
                      toggleItem={toggleItem}
                    />
                  )
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
