"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  type MouseEvent,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  addDays,
  formatDateISO,
  getTodayUTC,
  getViewRange,
  parseDateISO,
  type PlanView,
} from "@/lib/planDates";
import { addMealPlanItem, moveMealPlanItem, removeMealPlanItem } from "./actions";
import { fireConfetti } from "@/lib/confetti";
import CookingViewOverlay from "../cook/CookingViewOverlay";
import RecipeOverlay from "../cook/RecipeOverlay";
import type { RecipeDetail } from "../cook/types";

type RecipeItem = {
  id: string;
  title: string;
  sourceName: string | null;
  sourceUrl: string | null;
  photoUrl: string | null;
  rating: number | null;
  updatedAt: string;
};

type BasePlanItem = {
  id: string;
  dateISO: string;
  recipeId: string | null;
  type: "RECIPE" | "TAKEAWAY";
  title: string;
  photoUrl: string | null;
  isPending?: boolean;
};

type RecipePlanItem = BasePlanItem & {
  type: "RECIPE";
  recipeId: string;
};

type TakeawayPlanItem = BasePlanItem & {
  type: "TAKEAWAY";
  recipeId: null;
};

type PlanItem = RecipePlanItem | TakeawayPlanItem;

type PlanClientProps = {
  slug: string;
  workspaceName: string;
  recipes: RecipeItem[];
  planItems: PlanItem[];
  view: PlanView;
  focusedDateISO: string;
  selectedRecipe: RecipeDetail | null;
  selectedCookingRecipe: RecipeDetail | null;
};

const sourceOptions = [
  { value: "all", label: "All sources" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "manual", label: "Manual" },
  { value: "domain", label: "Domain" },
] as const;

const ratingOptions = [
  { value: "any", label: "Any rating" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5" },
] as const;

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TAKEAWAY_TITLE = "Take Away Night";
const TAKEAWAY_SUBTITLE = "No cooking, no ingredients";
const TAKEAWAY_TAGLINE = "Order in 🍜";

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
  return "Manual";
}

function getSourceCategory(recipe: RecipeItem) {
  const url = recipe.sourceUrl?.toLowerCase() ?? "";
  if (!url) return "manual";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("tiktok.com")) return "tiktok";
  return "domain";
}

function getMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function addMonths(date: Date, amount: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, date.getUTCDate()));
}

function RecipeRow({ recipe }: { recipe: RecipeItem }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `recipe-${recipe.id}`,
    data: { type: "paletteItem", kind: "RECIPE", recipeId: recipe.id },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`group flex cursor-grab items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      {recipe.photoUrl ? (
        <img
          src={recipe.photoUrl}
          alt={recipe.title}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-12 w-12 flex-none rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 flex-none items-center justify-center rounded-lg bg-slate-100 text-[10px] font-semibold text-slate-400">
          No photo
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900">{recipe.title}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {formatSource(recipe.sourceName, recipe.sourceUrl)}
        </p>
      </div>
    </div>
  );
}

function TakeawayIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 8h18" />
      <path d="M6 8V6a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v2" />
      <path d="M5 8l1.2 11.5A2 2 0 0 0 8.2 21h7.6a2 2 0 0 0 2-1.5L19 8" />
      <path d="M9 11v6" />
      <path d="M15 11v6" />
    </svg>
  );
}

function TakeawayTile() {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: "takeaway-tile",
    data: { type: "paletteItem", kind: "TAKEAWAY" },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`group flex cursor-grab items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50/80 px-3 py-3 text-sm text-slate-700 shadow-sm transition hover:border-amber-200 hover:bg-amber-50 ${
        isDragging ? "opacity-60" : ""
      }`}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-amber-500 shadow-sm">
        <TakeawayIcon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">{TAKEAWAY_TITLE}</p>
        <p className="text-xs text-slate-500">{TAKEAWAY_SUBTITLE}</p>
      </div>
    </div>
  );
}

function MonthEventChip({
  item,
  onRemove,
  onViewRecipe,
  onCookingView,
}: {
  item: RecipePlanItem;
  onRemove: (itemId: string) => void;
  onViewRecipe: (recipeId: string) => void;
  onCookingView: (recipeId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `plan-${item.id}`,
    data: {
      type: "planItem",
      itemId: item.id,
      dateISO: item.dateISO,
      itemType: item.type,
      recipeId: item.recipeId,
    },
  });

  const handleViewRecipe = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onViewRecipe(item.recipeId);
  };

  const handleCookingView = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onCookingView(item.recipeId);
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`group relative flex w-full flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-700 shadow-sm ${
        item.isPending || isDragging ? "opacity-60" : ""
      }`}
    >
      {item.photoUrl ? (
        <img
          src={item.photoUrl}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="aspect-square w-full rounded-md object-cover"
        />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center rounded-md bg-slate-100 text-[10px] font-semibold text-slate-400">
          No photo
        </div>
      )}
      <span className="min-w-0 whitespace-normal break-words font-medium text-slate-800">
        {item.title}
      </span>
      <div className="pointer-events-none mt-2 flex max-h-0 flex-col gap-2 overflow-hidden opacity-0 transition-all duration-150 ease-out group-hover:pointer-events-auto group-hover:max-h-24 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:max-h-24 group-focus-within:opacity-100">
        <button
          type="button"
          onClick={handleViewRecipe}
          onPointerDown={(event) => event.stopPropagation()}
          className="w-full rounded-full bg-[#0b1220] px-3 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-[#111a2e]"
        >
          View recipe
        </button>
        <button
          type="button"
          onClick={handleCookingView}
          onPointerDown={(event) => event.stopPropagation()}
          className="w-full rounded-full bg-[#0b1220] px-3 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-[#111a2e]"
        >
          Cooking view
        </button>
      </div>
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        onPointerDown={(event) => event.stopPropagation()}
        className="ml-auto hidden text-[10px] font-semibold text-slate-400 hover:text-slate-900 group-hover:block"
        aria-label="Remove from day"
      >
        ✕
      </button>
    </div>
  );
}

function MonthTakeawayChip({
  item,
  onRemove,
}: {
  item: TakeawayPlanItem;
  onRemove: (itemId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `plan-${item.id}`,
    data: { type: "planItem", itemId: item.id, dateISO: item.dateISO, itemType: item.type },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`group relative flex w-full items-center gap-2 rounded-lg border border-amber-100 bg-amber-50 px-2 py-2 text-xs text-slate-700 shadow-sm ${
        item.isPending || isDragging ? "opacity-60" : ""
      }`}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-amber-500">
        <TakeawayIcon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <span className="block text-xs font-semibold text-slate-800">{item.title}</span>
        <span className="text-[10px] text-slate-500">{TAKEAWAY_TAGLINE}</span>
      </div>
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        onPointerDown={(event) => event.stopPropagation()}
        className="ml-auto hidden text-[10px] font-semibold text-slate-400 hover:text-slate-900 group-hover:block"
        aria-label="Remove from day"
      >
        ✕
      </button>
    </div>
  );
}

function WeekEventCard({
  item,
  onRemove,
  onViewRecipe,
  onCookingView,
}: {
  item: RecipePlanItem;
  onRemove: (itemId: string) => void;
  onViewRecipe: (recipeId: string) => void;
  onCookingView: (recipeId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `plan-${item.id}`,
    data: {
      type: "planItem",
      itemId: item.id,
      dateISO: item.dateISO,
      itemType: item.type,
      recipeId: item.recipeId,
    },
  });

  const handleViewRecipe = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onViewRecipe(item.recipeId);
  };

  const handleCookingView = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onCookingView(item.recipeId);
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`group relative flex w-full flex-col gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-700 shadow-sm ${
        item.isPending || isDragging ? "opacity-60" : ""
      }`}
    >
      {item.photoUrl ? (
        <img
          src={item.photoUrl}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="aspect-square w-full rounded-lg object-cover"
        />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-slate-100 text-[10px] font-semibold text-slate-400">
          No photo
        </div>
      )}
      <span className="min-w-0 whitespace-normal break-words text-sm font-medium text-slate-800">
        {item.title}
      </span>
      <div className="pointer-events-none mt-2 flex max-h-0 flex-col gap-2 overflow-hidden opacity-0 transition-all duration-150 ease-out group-hover:pointer-events-auto group-hover:max-h-24 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:max-h-24 group-focus-within:opacity-100">
        <button
          type="button"
          onClick={handleViewRecipe}
          onPointerDown={(event) => event.stopPropagation()}
          className="w-full rounded-full bg-[#0b1220] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#111a2e]"
        >
          View recipe
        </button>
        <button
          type="button"
          onClick={handleCookingView}
          onPointerDown={(event) => event.stopPropagation()}
          className="w-full rounded-full bg-[#0b1220] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#111a2e]"
        >
          Cooking view
        </button>
      </div>
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        onPointerDown={(event) => event.stopPropagation()}
        className="ml-auto hidden text-[10px] font-semibold text-slate-400 hover:text-slate-900 group-hover:block"
        aria-label="Remove from day"
      >
        ✕
      </button>
    </div>
  );
}

function WeekTakeawayCard({
  item,
  onRemove,
}: {
  item: TakeawayPlanItem;
  onRemove: (itemId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `plan-${item.id}`,
    data: { type: "planItem", itemId: item.id, dateISO: item.dateISO, itemType: item.type },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`group relative flex w-full flex-col gap-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-3 text-xs text-slate-700 shadow-sm ${
        item.isPending || isDragging ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-center gap-2 rounded-lg bg-white px-2 py-2 text-amber-500 shadow-sm">
        <TakeawayIcon className="h-5 w-5" />
        <span className="text-xs font-semibold text-slate-800">{item.title}</span>
      </div>
      <span className="text-xs text-slate-500">{TAKEAWAY_TAGLINE}</span>
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        onPointerDown={(event) => event.stopPropagation()}
        className="ml-auto hidden text-[10px] font-semibold text-slate-400 hover:text-slate-900 group-hover:block"
        aria-label="Remove from day"
      >
        ✕
      </button>
    </div>
  );
}

function DayCell({
  dateISO,
  dayNumber,
  isMuted,
  isToday,
  view,
  items,
  onRemove,
  onViewRecipe,
  onCookingView,
}: {
  dateISO: string;
  dayNumber: number;
  isMuted: boolean;
  isToday: boolean;
  view: PlanView;
  items: PlanItem[];
  onRemove: (itemId: string) => void;
  onViewRecipe: (recipeId: string) => void;
  onCookingView: (recipeId: string) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: dateISO,
    data: { type: "day", dateISO },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[120px] flex-col gap-2 bg-white px-3 py-2 text-xs text-slate-500 transition ${
        isOver ? "bg-slate-50 ring-2 ring-slate-300" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-semibold ${
            isMuted ? "text-slate-400" : "text-slate-700"
          } ${isToday ? "rounded-full bg-slate-900 px-2 py-0.5 text-white" : ""}`}
        >
          {dayNumber}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item) =>
          item.type === "TAKEAWAY" ? (
            view === "week" ? (
              <WeekTakeawayCard key={item.id} item={item} onRemove={onRemove} />
            ) : (
              <MonthTakeawayChip key={item.id} item={item} onRemove={onRemove} />
            )
          ) : view === "week" ? (
            <WeekEventCard
              key={item.id}
              item={item}
              onRemove={onRemove}
              onViewRecipe={onViewRecipe}
              onCookingView={onCookingView}
            />
          ) : (
            <MonthEventChip
              key={item.id}
              item={item}
              onRemove={onRemove}
              onViewRecipe={onViewRecipe}
              onCookingView={onCookingView}
            />
          ),
        )}
        {items.length === 0 ? (
          <p className="text-[11px] text-slate-300">Drop here</p>
        ) : null}
      </div>
    </div>
  );
}

export default function PlanClient({
  slug,
  workspaceName,
  recipes,
  planItems,
  view,
  focusedDateISO,
  selectedRecipe,
  selectedCookingRecipe,
}: PlanClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [items, setItems] = useState<PlanItem[]>(planItems);
  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(null);
  const [activePlanItemId, setActivePlanItemId] = useState<string | null>(null);
  const [isDraggingTakeaway, setIsDraggingTakeaway] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [sourceFilter, setSourceFilter] = useState<(typeof sourceOptions)[number]["value"]>(
    "all",
  );
  const [ratingFilter, setRatingFilter] = useState<(typeof ratingOptions)[number]["value"]>(
    "any",
  );
  const searchRef = useRef<HTMLInputElement | null>(null);
  const calendarRef = useRef<HTMLDivElement | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    setItems(planItems);
  }, [planItems]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key !== "/") return;
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
        return;
      }
      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const focusedDate = useMemo(() => {
    return parseDateISO(focusedDateISO) ?? getTodayUTC();
  }, [focusedDateISO]);

  const { start, end } = useMemo(() => getViewRange(view, focusedDate), [view, focusedDate]);

  const days = useMemo(() => {
    const list: Date[] = [];
    let cursor = start;
    while (cursor.getTime() <= end.getTime()) {
      list.push(cursor);
      cursor = addDays(cursor, 1);
    }
    return list;
  }, [start, end]);

  const recipeMap = useMemo(() => {
    return new Map(recipes.map((recipe) => [recipe.id, recipe]));
  }, [recipes]);

  const itemsByDate = useMemo(() => {
    const map = new Map<string, PlanItem[]>();
    items.forEach((item) => {
      const list = map.get(item.dateISO) ?? [];
      list.push(item);
      map.set(item.dateISO, list);
    });
    return map;
  }, [items]);

  const filteredRecipes = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return recipes.filter((recipe) => {
      if (query && !recipe.title.toLowerCase().includes(query)) {
        return false;
      }
      if (sourceFilter !== "all" && getSourceCategory(recipe) !== sourceFilter) {
        return false;
      }
      if (ratingFilter !== "any") {
        const minRating = Number(ratingFilter);
        if ((recipe.rating ?? 0) < minRating) return false;
      }
      return true;
    });
  }, [recipes, searchText, sourceFilter, ratingFilter]);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value) {
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

  const setFocusedDate = useCallback(
    (date: Date) => {
      updateParams({
        view,
        date: formatDateISO(date),
      });
    },
    [updateParams, view],
  );

  const getConfettiOrigin = useCallback(
    (rect?: DOMRect | null) => {
      if (typeof window === "undefined") return null;
      const fallback = calendarRef.current?.getBoundingClientRect() ?? null;
      const target = rect ?? fallback;
      if (!target) return null;
      const x = (target.left + target.width / 2) / window.innerWidth;
      const y = (target.top + target.height / 2) / window.innerHeight;
      return { x, y };
    },
    [],
  );

  const handleToday = () => {
    setFocusedDate(getTodayUTC());
  };

  const handlePrev = () => {
    const nextDate = view === "month" ? addMonths(focusedDate, -1) : addDays(focusedDate, -7);
    setFocusedDate(nextDate);
  };

  const handleNext = () => {
    const nextDate = view === "month" ? addMonths(focusedDate, 1) : addDays(focusedDate, 7);
    setFocusedDate(nextDate);
  };

  const handleViewChange = (nextView: PlanView) => {
    updateParams({ view: nextView, date: focusedDateISO });
  };

  const handleAddRecipe = async (dateISO: string, recipeId: string) => {
    if (items.some((item) => item.dateISO === dateISO && item.recipeId === recipeId)) {
      return;
    }

    const recipe = recipeMap.get(recipeId);
    if (!recipe) return;

    const tempId = `temp-${recipeId}-${Date.now()}`;
    setItems((prev) => [
      ...prev,
      {
        id: tempId,
        dateISO,
        recipeId,
        type: "RECIPE",
        title: recipe.title,
        photoUrl: recipe.photoUrl,
        isPending: true,
      },
    ]);

    startTransition(async () => {
      const result = await addMealPlanItem({ slug, dateISO, recipeId, type: "RECIPE" });
      if (!result?.item) {
        setItems((prev) => prev.filter((item) => item.id !== tempId));
        return;
      }
      setItems((prev) =>
        prev.map((item) => (item.id === tempId ? { ...result.item } : item)),
      );
    });
  };

  const handleAddTakeaway = async (dateISO: string, confettiOrigin?: { x: number; y: number } | null) => {
    const tempId = `temp-takeaway-${Date.now()}`;
    setItems((prev) => [
      ...prev,
      {
        id: tempId,
        dateISO,
        recipeId: null,
        type: "TAKEAWAY",
        title: TAKEAWAY_TITLE,
        photoUrl: null,
        isPending: true,
      },
    ]);

    startTransition(async () => {
      const result = await addMealPlanItem({ slug, dateISO, type: "TAKEAWAY" });
      if (!result?.item) {
        setItems((prev) => prev.filter((item) => item.id !== tempId));
        return;
      }
      setItems((prev) =>
        prev.map((item) => (item.id === tempId ? { ...result.item } : item)),
      );
      fireConfetti(confettiOrigin);
    });
  };

  const handleRemoveItem = async (itemId: string) => {
    const existing = items.find((item) => item.id === itemId);
    if (!existing) return;
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    startTransition(async () => {
      try {
        await removeMealPlanItem({ slug, itemId });
      } catch {
        setItems((prev) => [...prev, existing]);
      }
    });
  };

  const activeRecipe = activeRecipeId ? recipeMap.get(activeRecipeId) ?? null : null;
  const activePlanItem = activePlanItemId
    ? items.find((item) => item.id === activePlanItemId) ?? null
    : null;
  const isActiveTakeaway = isDraggingTakeaway || activePlanItem?.type === "TAKEAWAY";
  const currentRecipeId = searchParams.get("recipeId") ?? selectedRecipe?.id ?? null;
  const currentCookRecipeId =
    searchParams.get("cookRecipeId") ?? selectedCookingRecipe?.id ?? null;
  const isCookingView = searchParams.get("cookView") === "1";

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(event) => {
        const data = event.active.data.current;
        if (data?.type === "paletteItem" && data.kind === "RECIPE") {
          setActiveRecipeId(data.recipeId);
          setActivePlanItemId(null);
          setIsDraggingTakeaway(false);
        }
        if (data?.type === "paletteItem" && data.kind === "TAKEAWAY") {
          setActiveRecipeId(null);
          setActivePlanItemId(null);
          setIsDraggingTakeaway(true);
        }
        if (data?.type === "planItem") {
          setActivePlanItemId(data.itemId);
          setActiveRecipeId(null);
          setIsDraggingTakeaway(false);
        }
      }}
      onDragEnd={(event) => {
        const data = event.active.data.current;
        const dropTarget = event.over?.id;
        const confettiOrigin = getConfettiOrigin(event.over?.rect);
        setActiveRecipeId(null);
        setActivePlanItemId(null);
        setIsDraggingTakeaway(false);
        if (data?.type === "paletteItem" && data.kind === "RECIPE" && typeof dropTarget === "string") {
          void handleAddRecipe(dropTarget, data.recipeId as string);
        }
        if (data?.type === "paletteItem" && data.kind === "TAKEAWAY" && typeof dropTarget === "string") {
          void handleAddTakeaway(dropTarget, confettiOrigin);
        }
        if (data?.type === "planItem" && typeof dropTarget === "string") {
          const nextDateISO = dropTarget;
          const itemId = data.itemId as string;
          const prevDateISO = data.dateISO as string;
          if (nextDateISO === prevDateISO) return;
          setItems((prev) =>
            prev.map((item) =>
              item.id === itemId ? { ...item, dateISO: nextDateISO } : item,
            ),
          );
          startTransition(async () => {
            try {
              await moveMealPlanItem({ slug, itemId, dateISO: nextDateISO });
            } catch {
              setItems((prev) =>
                prev.map((item) =>
                  item.id === itemId ? { ...item, dateISO: prevDateISO } : item,
                ),
              );
            }
          });
        }
      }}
      onDragCancel={() => {
        setActiveRecipeId(null);
        setActivePlanItemId(null);
        setIsDraggingTakeaway(false);
      }}
    >
      <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-6 py-6 lg:flex-row">
        <section className="flex w-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:h-[calc(100vh-200px)] lg:min-w-[260px] lg:max-w-[320px] lg:flex-[0_0_20%]">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{workspaceName}</h1>
            <p className="text-xs text-slate-500">Plan meals for the week ahead.</p>
          </div>
          <div className="space-y-3">
            <input
              ref={searchRef}
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search recipes"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <select
                value={sourceFilter}
                onChange={(event) =>
                  setSourceFilter(event.target.value as (typeof sourceOptions)[number]["value"])
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-600 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              >
                {sourceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={ratingFilter}
                onChange={(event) =>
                  setRatingFilter(event.target.value as (typeof ratingOptions)[number]["value"])
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-600 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              >
                {ratingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-400">
              {filteredRecipes.length} recipes · drag into calendar
            </p>
          </div>
          <div className="flex-1 overflow-y-auto pr-1">
            <div className="space-y-2">
              {filteredRecipes.map((recipe) => (
                <RecipeRow key={recipe.id} recipe={recipe} />
              ))}
              {filteredRecipes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                  No recipes match your filters.
                </div>
              ) : null}
            </div>
          </div>
          <div className="border-t border-slate-100 pt-3">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700">Quick add</p>
                <p className="text-[11px] text-slate-400">Extras that skip cooking.</p>
              </div>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                Extras
              </span>
            </div>
            <TakeawayTile />
          </div>
        </section>

        <section className="flex min-h-[600px] flex-1 flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1 text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => handleViewChange("month")}
                className={`rounded-full px-3 py-1 transition ${
                  view === "month"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => handleViewChange("week")}
                className={`rounded-full px-3 py-1 transition ${
                  view === "week" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-white"
                }`}
              >
                Week
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <button
                type="button"
                onClick={handlePrev}
                className="rounded-full border border-slate-200 px-2 py-1 text-slate-600 hover:border-slate-300 hover:text-slate-900"
              >
                ←
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-300"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="rounded-full border border-slate-200 px-2 py-1 text-slate-600 hover:border-slate-300 hover:text-slate-900"
              >
                →
              </button>
              <span className="ml-2 text-base font-semibold text-slate-900">
                {getMonthLabel(focusedDate)}
              </span>
            </div>
            {isPending ? (
              <span className="text-xs font-semibold text-slate-400">Saving…</span>
            ) : null}
          </header>

          <div className="grid grid-cols-7 gap-2 text-xs font-semibold text-slate-400">
            {weekdayLabels.map((label) => (
              <div key={label} className="px-2">
                {label}
              </div>
            ))}
          </div>

          <div
            ref={calendarRef}
            className="grid grid-cols-7 gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200"
            style={{
              gridTemplateRows:
                view === "week"
                  ? "minmax(220px, auto)"
                  : `repeat(${Math.ceil(days.length / 7)}, minmax(140px, auto))`,
            }}
          >
            {days.map((date) => {
              const dateISO = formatDateISO(date);
              const dayItems = itemsByDate.get(dateISO) ?? [];
              const isMuted =
                view === "month" && date.getUTCMonth() !== focusedDate.getUTCMonth();
              const isToday = formatDateISO(date) === formatDateISO(getTodayUTC());
              return (
                <DayCell
                  key={dateISO}
                  dateISO={dateISO}
                  dayNumber={date.getUTCDate()}
                  isMuted={isMuted}
                  isToday={isToday}
                  view={view}
                  items={dayItems}
                  onRemove={handleRemoveItem}
                  onViewRecipe={(recipeId) =>
                    updateParams({ recipeId, cookRecipeId: null, cookView: null })
                  }
                  onCookingView={(recipeId) =>
                    updateParams({ cookRecipeId: recipeId, cookView: "1", recipeId: null })
                  }
                />
              );
            })}
          </div>
        </section>
      </main>

      {selectedRecipe && currentRecipeId === selectedRecipe.id && !isCookingView && (
        <RecipeOverlay
          slug={slug}
          recipe={selectedRecipe}
          onClose={() => updateParams({ recipeId: null })}
          onOpenCookingView={() =>
            updateParams({
              cookRecipeId: selectedRecipe.id,
              cookView: "1",
              recipeId: null,
            })
          }
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

      <DragOverlay>
        {isActiveTakeaway ? (
          <div className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-slate-700 shadow-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-amber-500 shadow-sm">
              <TakeawayIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="whitespace-normal break-words text-sm font-semibold text-slate-900">
                {TAKEAWAY_TITLE}
              </p>
              <p className="text-xs text-slate-500">{TAKEAWAY_TAGLINE}</p>
            </div>
          </div>
        ) : activeRecipe || activePlanItem ? (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-lg">
            {(activeRecipe?.photoUrl ?? activePlanItem?.photoUrl) ? (
              <img
                src={activeRecipe?.photoUrl ?? activePlanItem?.photoUrl ?? ""}
                alt=""
                referrerPolicy="no-referrer"
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-semibold text-slate-400">
                No photo
              </div>
            )}
            <div className="min-w-0">
              <p className="whitespace-normal break-words text-sm font-medium text-slate-900">
                {activeRecipe?.title ?? activePlanItem?.title}
              </p>
              {activeRecipe ? (
                <p className="text-xs text-slate-500">
                  {formatSource(activeRecipe.sourceName, activeRecipe.sourceUrl)}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
