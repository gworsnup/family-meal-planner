"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  type ClientRect,
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
  type ReactNode,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  addDays,
  endOfMonth,
  formatDateISO,
  getTodayUTC,
  getViewRange,
  parseDateISO,
  startOfMonth,
  startOfWeek,
  type PlanView,
} from "@/lib/planDates";
import { addMealPlanItem, moveMealPlanItem, removeMealPlanItem } from "./actions";
import {
  applyMealTemplateToTarget,
  createMealTemplateFromSelection,
  deleteMealTemplate,
  type MealTemplateMode,
  type MealTemplateScope,
  type MealTemplateSummary,
} from "@/lib/templates/actions";
import { fireConfetti } from "@/lib/confetti";
import CookingViewOverlay from "../cook/CookingViewOverlay";
import RecipeOverlay from "../cook/RecipeOverlay";
import type { RecipeDetail } from "../cook/types";
import WhatsAppShareButton from "@/app/_components/WhatsAppShareButton";
import { ModeSegmentedControl } from "./ModeSegmentedControl";

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
  templates: MealTemplateSummary[];
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
type RectLike = ClientRect | DOMRect | null | undefined;
type ConfettiOrigin = { x: number; y: number };
type LeftPanelTab = "recipes" | "templates";
type SelectionMode = "week" | "month" | null;

type TemplateTarget =
  | { scope: "WEEK"; weekStartISO: string }
  | { scope: "MONTH"; monthStartISO: string };

function normalizePlanItem(item: {
  id: string;
  dateISO: string;
  recipeId: string | null;
  type: "RECIPE" | "TAKEAWAY";
  title: string;
  photoUrl: string | null;
  isPending?: boolean;
}): PlanItem {
  if (item.type === "TAKEAWAY") {
    return {
      id: item.id,
      dateISO: item.dateISO,
      recipeId: null,
      type: "TAKEAWAY",
      title: item.title,
      photoUrl: item.photoUrl,
      isPending: item.isPending,
    };
  }
  return {
    id: item.id,
    dateISO: item.dateISO,
    recipeId: item.recipeId ?? "",
    type: "RECIPE",
    title: item.title,
    photoUrl: item.photoUrl,
    isPending: item.isPending,
  };
}

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

function getWeekKey(dateISO: string) {
  const parsed = parseDateISO(dateISO);
  if (!parsed) return null;
  return formatDateISO(startOfWeek(parsed));
}

function normalizeDateISO(dateISO: string) {
  return parseDateISO(dateISO) ?? getTodayUTC();
}

function getMonthGridRangeFromISO(monthStartISO: string) {
  const parsed = parseDateISO(monthStartISO) ?? getTodayUTC();
  const monthStart = startOfMonth(parsed);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = startOfWeek(endOfMonth(monthStart));
  return { rangeStart: gridStart, rangeEnd: addDays(gridEnd, 6) };
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
      className={`group flex cursor-grab items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-[#fafafa] ${
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
      className={`group flex cursor-grab items-center gap-2 rounded-2xl border border-amber-100 bg-amber-50/80 px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:border-amber-200 hover:bg-amber-50 ${
        isDragging ? "opacity-60" : ""
      }`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-amber-500 shadow-sm">
        <TakeawayIcon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">{TAKEAWAY_TITLE}</p>
        <p className="text-xs text-slate-500">{TAKEAWAY_SUBTITLE}</p>
      </div>
    </div>
  );
}

function TemplateCard({
  template,
  onDelete,
}: {
  template: MealTemplateSummary;
  onDelete: (templateId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `template-${template.id}`,
    data: { type: "template", templateId: template.id, scope: template.scope },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`group flex cursor-grab items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-[#fafafa] ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">{template.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
            {template.scope}
          </span>
          <span>{template.itemCount} meals</span>
        </div>
      </div>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onDelete(template.id);
        }}
        onPointerDown={(event) => event.stopPropagation()}
        className="hidden rounded-full border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-500 hover:border-slate-300 hover:text-slate-700 group-hover:block"
      >
        Delete
      </button>
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
      className={`group relative flex w-full flex-col gap-2 rounded-lg border border-slate-200 bg-[#fafafa] px-2 py-2 text-xs text-slate-700 shadow-sm ${
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
          className="w-full rounded-full bg-[#0b1220] px-4 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#111a2e] whitespace-nowrap"
        >
          View recipe
        </button>
        <button
          type="button"
          onClick={handleCookingView}
          onPointerDown={(event) => event.stopPropagation()}
          className="w-full rounded-full bg-[#0b1220] px-4 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#111a2e] whitespace-nowrap"
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
  disableDrop,
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
  disableDrop: boolean;
  view: PlanView;
  items: PlanItem[];
  onRemove: (itemId: string) => void;
  onViewRecipe: (recipeId: string) => void;
  onCookingView: (recipeId: string) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: dateISO,
    data: { type: "day", dateISO },
    disabled: disableDrop,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex ${view === "week" ? "min-h-[220px]" : "min-h-[120px]"} flex-col gap-2 bg-white px-3 py-2 text-xs text-slate-500 transition ${
        isOver ? "bg-[#fafafa] ring-2 ring-slate-300" : ""
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

function WeekRow({
  weekStartISO,
  selectionMode,
  isHovered,
  onHoverChange,
  onSelect,
  activeTemplateScope,
  isDraggingTemplate,
  children,
}: {
  weekStartISO: string;
  selectionMode: SelectionMode;
  isHovered: boolean;
  onHoverChange: (next: boolean) => void;
  onSelect: (weekStartISO: string) => void;
  activeTemplateScope: MealTemplateScope | null;
  isDraggingTemplate: boolean;
  children: ReactNode;
}) {
  const isWeekTarget = activeTemplateScope === "WEEK";
  const { isOver, setNodeRef } = useDroppable({
    id: `template-week-${weekStartISO}`,
    data: { type: "templateTarget", scope: "WEEK", weekStartISO },
    disabled: !isDraggingTemplate || !isWeekTarget,
  });

  const showSelection = selectionMode === "week";
  const shouldHighlight = (isOver && isWeekTarget) || (showSelection && isHovered);

  return (
    <div className="relative">
      <div className="grid grid-cols-7 gap-px">{children}</div>
      <button
        type="button"
        ref={setNodeRef}
        onClick={() => {
          if (showSelection) onSelect(weekStartISO);
        }}
        onMouseEnter={() => onHoverChange(true)}
        onMouseLeave={() => onHoverChange(false)}
        className={`absolute inset-0 rounded-xl transition ${
          shouldHighlight ? "bg-slate-900/5 ring-2 ring-slate-300" : ""
        } ${showSelection ? "cursor-pointer" : "cursor-default"} ${
          showSelection ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-label={showSelection ? "Select week" : undefined}
      />
    </div>
  );
}

function MonthDropZone({
  monthStartISO,
  selectionMode,
  isHovered,
  onHoverChange,
  onSelect,
  activeTemplateScope,
  isDraggingTemplate,
  children,
}: {
  monthStartISO: string;
  selectionMode: SelectionMode;
  isHovered: boolean;
  onHoverChange: (next: boolean) => void;
  onSelect: (monthStartISO: string) => void;
  activeTemplateScope: MealTemplateScope | null;
  isDraggingTemplate: boolean;
  children: ReactNode;
}) {
  const isMonthTarget = activeTemplateScope === "MONTH";
  const { isOver, setNodeRef } = useDroppable({
    id: `template-month-${monthStartISO}`,
    data: { type: "templateTarget", scope: "MONTH", monthStartISO },
    disabled: !isDraggingTemplate || !isMonthTarget,
  });

  const showSelection = selectionMode === "month";
  const shouldHighlight = (isOver && isMonthTarget) || (showSelection && isHovered);

  return (
    <div ref={setNodeRef} className="relative">
      {children}
      <button
        type="button"
        onClick={() => {
          if (showSelection) onSelect(monthStartISO);
        }}
        onMouseEnter={() => onHoverChange(true)}
        onMouseLeave={() => onHoverChange(false)}
        className={`absolute inset-0 rounded-2xl transition ${
          shouldHighlight ? "bg-slate-900/5 ring-2 ring-slate-300" : ""
        } ${showSelection ? "cursor-pointer" : "cursor-default"} ${
          showSelection ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-label={showSelection ? "Select month" : undefined}
      />
    </div>
  );
}

export default function PlanClient({
  slug,
  workspaceName,
  recipes,
  planItems,
  templates: initialTemplates,
  view,
  focusedDateISO,
  selectedRecipe,
  selectedCookingRecipe,
}: PlanClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isTemplatePending, startTemplateTransition] = useTransition();
  const [items, setItems] = useState<PlanItem[]>(planItems);
  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(null);
  const [activePlanItemId, setActivePlanItemId] = useState<string | null>(null);
  const [isDraggingTakeaway, setIsDraggingTakeaway] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [activeTemplateScope, setActiveTemplateScope] = useState<MealTemplateScope | null>(null);
  const [isDraggingTemplate, setIsDraggingTemplate] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [sourceFilter, setSourceFilter] = useState<(typeof sourceOptions)[number]["value"]>(
    "all",
  );
  const [ratingFilter, setRatingFilter] = useState<(typeof ratingOptions)[number]["value"]>(
    "any",
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [leftTab, setLeftTab] = useState<LeftPanelTab>("recipes");
  const [templates, setTemplates] = useState<MealTemplateSummary[]>(initialTemplates);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(null);
  const [weekHoverKey, setWeekHoverKey] = useState<string | null>(null);
  const [monthHover, setMonthHover] = useState(false);
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);
  const [saveDialog, setSaveDialog] = useState<{
    scope: MealTemplateScope;
    weekStartISO?: string;
    monthStartISO?: string;
  } | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmPopover, setConfirmPopover] = useState<{
    templateId: string;
    target: TemplateTarget;
    position: { x: number; y: number };
  } | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const confettiWeeksRef = useRef<Set<string>>(new Set());
  const filtersId = useId();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    setItems(planItems);
  }, [planItems]);

  useEffect(() => {
    setTemplates(initialTemplates);
  }, [initialTemplates]);

  useEffect(() => {
    planItems.forEach((item) => {
      if (item.type !== "TAKEAWAY") return;
      const key = getWeekKey(item.dateISO);
      if (key) {
        confettiWeeksRef.current.add(key);
      }
    });
  }, [planItems]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (confirmPopover) setConfirmPopover(null);
        if (saveDialog) setSaveDialog(null);
        if (selectionMode) {
          setSelectionMode(null);
          setSaveMenuOpen(false);
          setWeekHoverKey(null);
          setMonthHover(false);
        }
        return;
      }
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
  }, [confirmPopover, saveDialog, selectionMode]);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = window.setTimeout(() => setToastMessage(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  useEffect(() => {
    if (!saveDialog) return;
    setTemplateError(null);
    if (saveDialog.scope === "WEEK" && saveDialog.weekStartISO) {
      const parsed = parseDateISO(saveDialog.weekStartISO);
      if (parsed) {
        const label = new Intl.DateTimeFormat("en-US", {
          day: "2-digit",
          month: "short",
          timeZone: "UTC",
        }).format(parsed);
        setTemplateName(`Week of ${label}`);
        return;
      }
    }
    if (saveDialog.scope === "MONTH" && saveDialog.monthStartISO) {
      const parsed = parseDateISO(saveDialog.monthStartISO);
      if (parsed) {
        setTemplateName(getMonthLabel(parsed));
        return;
      }
    }
    setTemplateName("");
  }, [saveDialog]);

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

  const weeks = useMemo(() => {
    const rows: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7));
    }
    return rows;
  }, [days]);

  const monthStartISO = useMemo(() => {
    const parsed = parseDateISO(focusedDateISO) ?? getTodayUTC();
    const monthStart = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), 1));
    return formatDateISO(monthStart);
  }, [focusedDateISO]);

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

  const hasItemsInView = useMemo(() => {
    return items.some((item) => {
      const date = parseDateISO(item.dateISO);
      if (!date) return false;
      return date >= start && date <= end;
    });
  }, [items, start, end]);

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

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  const setFocusedDate = useCallback(
    (date: Date) => {
      updateParams({
        view,
        date: formatDateISO(date),
      });
    },
    [updateParams, view],
  );

  const getConfettiOrigin = useCallback((rect: RectLike) => {
    if (typeof window === "undefined") return null;
    const fallback = calendarRef.current?.getBoundingClientRect() ?? null;
    const target = rect ?? fallback;
    if (!target) return null;
    const left = "x" in target ? target.x : target.left;
    const top = "y" in target ? target.y : target.top;
    const x = (left + target.width / 2) / window.innerWidth;
    const y = (top + target.height / 2) / window.innerHeight;
    return { x, y };
  }, []);

  const getPopoverPosition = useCallback((rect: RectLike) => {
    if (typeof window === "undefined") return { x: 0, y: 0 };
    const fallback = calendarRef.current?.getBoundingClientRect() ?? null;
    const target = rect ?? fallback;
    if (!target) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const left = "x" in target ? target.x : target.left;
    const top = "y" in target ? target.y : target.top;
    const x = Math.min(Math.max(left + target.width / 2, 24), window.innerWidth - 24);
    const y = Math.min(Math.max(top + target.height / 2, 24), window.innerHeight - 24);
    return { x, y };
  }, []);

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
        prev.map((item) =>
          item.id === tempId ? normalizePlanItem({ ...result.item }) : item,
        ),
      );
    });
  };

  const handleAddTakeaway = async (
    dateISO: string,
    confettiOrigin?: ConfettiOrigin | null,
  ) => {
    const weekKey = getWeekKey(dateISO);
    const shouldFireConfetti = weekKey ? !confettiWeeksRef.current.has(weekKey) : false;
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
        prev.map((item) =>
          item.id === tempId ? normalizePlanItem({ ...result.item }) : item,
        ),
      );
      if (weekKey) {
        confettiWeeksRef.current.add(weekKey);
      }
      if (shouldFireConfetti) {
        fireConfetti(confettiOrigin);
      }
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

  const getItemsInRange = useCallback(
    (rangeStart: Date, rangeEnd: Date) => {
      return items.filter((item) => {
        const date = parseDateISO(item.dateISO);
        if (!date) return false;
        return date >= rangeStart && date <= rangeEnd;
      });
    },
    [items],
  );

  const getTemplateRange = useCallback((target: TemplateTarget) => {
    if (target.scope === "WEEK") {
      const rangeStart = startOfWeek(normalizeDateISO(target.weekStartISO));
      return { rangeStart, rangeEnd: addDays(rangeStart, 6) };
    }
    return getMonthGridRangeFromISO(target.monthStartISO);
  }, []);

  const applyTemplate = useCallback(
    async (templateId: string, target: TemplateTarget, mode: MealTemplateMode) => {
      startTemplateTransition(async () => {
        const result = await applyMealTemplateToTarget({ slug, templateId, target, mode });
        if (!result.ok) {
          showToast("Couldn't apply template. Please try again.");
          return;
        }
        const { rangeStart, rangeEnd } =
          target.scope === "WEEK"
            ? {
                rangeStart: startOfWeek(normalizeDateISO(target.weekStartISO)),
                rangeEnd: addDays(startOfWeek(normalizeDateISO(target.weekStartISO)), 6),
              }
            : getMonthGridRangeFromISO(target.monthStartISO);
        setItems((prev) => {
          const remaining = prev.filter((item) => {
            const date = parseDateISO(item.dateISO);
            if (!date) return true;
            return date < rangeStart || date > rangeEnd;
          });
          return [...remaining, ...result.items];
        });
        if (result.skipped > 0) {
          showToast(`Template applied — ${result.skipped} meals skipped (missing recipes).`);
        } else {
          showToast("Template applied");
        }
      });
    },
    [slug, showToast, startTemplateTransition],
  );

  const handleSaveTemplate = useCallback(async () => {
    if (!saveDialog) return;
    const trimmedName = templateName.trim();
    if (!trimmedName) {
      setTemplateError("Name is required.");
      return;
    }
    setTemplateError(null);
    startTemplateTransition(async () => {
      const result = await createMealTemplateFromSelection({
        slug,
        name: trimmedName,
        scope: saveDialog.scope,
        weekStartISO: saveDialog.weekStartISO,
        monthStartISO: saveDialog.monthStartISO,
      });
      if (!result.ok || !result.template) {
        setTemplateError(result.error ?? "Unable to save template.");
        return;
      }
      setTemplates((prev) => [result.template, ...prev]);
      setSaveDialog(null);
      setSelectionMode(null);
      showToast("Template saved");
    });
  }, [saveDialog, slug, templateName, showToast, startTemplateTransition]);

  const handleDeleteTemplate = useCallback(
    (templateId: string) => {
      const previous = templates;
      setTemplates((prev) => prev.filter((template) => template.id !== templateId));
      startTemplateTransition(async () => {
        try {
          await deleteMealTemplate({ slug, templateId });
        } catch {
          setTemplates(previous);
          showToast("Couldn't delete template. Please try again.");
        }
      });
    },
    [showToast, slug, startTemplateTransition, templates],
  );

  const activeRecipe = activeRecipeId ? recipeMap.get(activeRecipeId) ?? null : null;
  const activePlanItem = activePlanItemId
    ? items.find((item) => item.id === activePlanItemId) ?? null
    : null;
  const activeTemplate = activeTemplateId
    ? templates.find((template) => template.id === activeTemplateId) ?? null
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
          setActiveTemplateId(null);
          setActiveTemplateScope(null);
          setIsDraggingTemplate(false);
        }
        if (data?.type === "paletteItem" && data.kind === "TAKEAWAY") {
          setActiveRecipeId(null);
          setActivePlanItemId(null);
          setIsDraggingTakeaway(true);
          setActiveTemplateId(null);
          setActiveTemplateScope(null);
          setIsDraggingTemplate(false);
        }
        if (data?.type === "planItem") {
          setActivePlanItemId(data.itemId);
          setActiveRecipeId(null);
          setIsDraggingTakeaway(false);
          setActiveTemplateId(null);
          setActiveTemplateScope(null);
          setIsDraggingTemplate(false);
        }
        if (data?.type === "template") {
          setActiveTemplateId(data.templateId);
          setActiveTemplateScope(data.scope as MealTemplateScope);
          setActiveRecipeId(null);
          setActivePlanItemId(null);
          setIsDraggingTakeaway(false);
          setIsDraggingTemplate(true);
          setConfirmPopover(null);
        }
      }}
      onDragEnd={(event) => {
        const data = event.active.data.current;
        const dropTarget = event.over?.id;
        const overData = event.over?.data.current;
        const confettiOrigin = getConfettiOrigin(event.over?.rect);
        setActiveRecipeId(null);
        setActivePlanItemId(null);
        setIsDraggingTakeaway(false);
        setActiveTemplateId(null);
        setActiveTemplateScope(null);
        setIsDraggingTemplate(false);
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
        if (data?.type === "template" && overData?.type === "templateTarget") {
          const targetScope = overData.scope as MealTemplateScope;
          const templateScope = data.scope as MealTemplateScope;
          if (targetScope !== templateScope) return;
          const target: TemplateTarget =
            targetScope === "WEEK"
              ? { scope: "WEEK", weekStartISO: overData.weekStartISO as string }
              : { scope: "MONTH", monthStartISO: overData.monthStartISO as string };
          const { rangeStart, rangeEnd } = getTemplateRange(target);
          const existing = getItemsInRange(rangeStart, rangeEnd);
          if (existing.length > 0) {
            setConfirmPopover({
              templateId: data.templateId as string,
              target,
              position: getPopoverPosition(event.over?.rect),
            });
            return;
          }
          void applyTemplate(data.templateId as string, target, "REPLACE");
        }
      }}
      onDragCancel={() => {
        setActiveRecipeId(null);
        setActivePlanItemId(null);
        setIsDraggingTakeaway(false);
        setActiveTemplateId(null);
        setActiveTemplateScope(null);
        setIsDraggingTemplate(false);
      }}
    >
      <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-6 py-6 lg:flex-row">
        <section className="flex w-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 lg:h-[calc(100vh-200px)] lg:min-w-[260px] lg:max-w-[320px] lg:flex-[0_0_20%]">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{workspaceName}</h1>
            <p className="text-xs text-slate-500">Plan meals for the week ahead.</p>
          </div>
          <ModeSegmentedControl value={leftTab} onChange={setLeftTab} />
          {leftTab === "recipes" ? (
            <>
              <div className="space-y-2">
                <input
                  ref={searchRef}
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search recipes"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
                <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-400">
                  <button
                    type="button"
                    onClick={() => setFiltersOpen((prev) => !prev)}
                    aria-expanded={filtersOpen}
                    aria-controls={filtersId}
                    className="inline-flex items-center gap-1 font-semibold text-slate-900 transition hover:text-slate-700"
                  >
                    <span>Filters</span>
                    <svg
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                      className={`h-3.5 w-3.5 text-slate-500 transition ${filtersOpen ? "rotate-180" : ""}`}
                    >
                      <path
                        fill="currentColor"
                        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                      />
                    </svg>
                  </button>
                  <span aria-hidden="true">·</span>
                  <span>{filteredRecipes.length} recipes</span>
                  <span aria-hidden="true">·</span>
                  <span>drag into calendar</span>
                </div>
                {filtersOpen ? (
                  <div id={filtersId} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                    <select
                      value={sourceFilter}
                      onChange={(event) =>
                        setSourceFilter(
                          event.target.value as (typeof sourceOptions)[number]["value"],
                        )
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
                        setRatingFilter(
                          event.target.value as (typeof ratingOptions)[number]["value"],
                        )
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
                ) : null}
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
            </>
          ) : (
            <>
              <p className="text-[11px] text-slate-400">
                Drag a template into the calendar to reuse it.
              </p>
              <div className="flex-1 overflow-y-auto pr-1">
                <div className="space-y-2">
                  {templates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onDelete={handleDeleteTemplate}
                    />
                  ))}
                  {templates.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                      No templates yet. Save a week or month from your plan to reuse it here.
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Smart Templates</p>
                    <p className="text-[11px] text-slate-400">
                      Drop smart templates here to auto-generate meals.
                    </p>
                  </div>
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                    Smart
                  </span>
                </div>
                <div className="rounded-xl border border-dashed border-slate-200 bg-[#fafafa] p-4 text-center text-xs text-slate-400">
                  Smart templates will appear here soon.
                </div>
              </div>
            </>
          )}
        </section>

        <section className="flex min-h-[600px] flex-1 flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-[#fafafa] p-1 text-xs font-semibold text-slate-600">
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
              {hasItemsInView ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSaveMenuOpen((prev) => !prev)}
                    className="flex h-8 items-center gap-2 rounded-full bg-slate-900 px-4 py-1 text-xs font-semibold text-white transition hover:bg-slate-800"
                  >
                    Save meal template
                    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3 w-3 text-white">
                      <path
                        fill="currentColor"
                        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                      />
                    </svg>
                  </button>
                  {saveMenuOpen ? (
                    <div className="absolute left-0 top-full z-20 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-1 text-xs text-slate-700 shadow-lg">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectionMode("week");
                          setSaveMenuOpen(false);
                        }}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-slate-50"
                      >
                        Save week
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectionMode("month");
                          if (view !== "month") {
                            handleViewChange("month");
                          }
                          setSaveMenuOpen(false);
                        }}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left hover:bg-slate-50"
                      >
                        Save month
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
              <WhatsAppShareButton label="Share via WhatsApp" className="h-8 px-3 py-1" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
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
            </div>
          {isPending || isTemplatePending ? (
            <span className="text-xs font-semibold text-slate-400">Saving…</span>
          ) : null}
        </header>

        {selectionMode ? (
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-[#fafafa] px-3 py-2 text-xs font-semibold text-slate-700">
            <span>
              {selectionMode === "week"
                ? "Select a week to save as a template"
                : "Select the month to save as a template"}
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectionMode(null);
                setWeekHoverKey(null);
                setMonthHover(false);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              Cancel
            </button>
          </div>
        ) : null}

        <div className="grid grid-cols-7 gap-2 text-xs font-semibold text-slate-400">
            {weekdayLabels.map((label) => (
              <div key={label} className="px-2">
                {label}
              </div>
            ))}
          </div>

          <div
            ref={calendarRef}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-200"
          >
            <MonthDropZone
              monthStartISO={monthStartISO}
              selectionMode={selectionMode}
              isHovered={monthHover}
              onHoverChange={setMonthHover}
              onSelect={(nextMonthStartISO) => {
                setSaveDialog({ scope: "MONTH", monthStartISO: nextMonthStartISO });
                setSelectionMode(null);
                setMonthHover(false);
              }}
              activeTemplateScope={view === "month" ? activeTemplateScope : null}
              isDraggingTemplate={isDraggingTemplate && view === "month"}
            >
              <div className="flex flex-col gap-px">
                {weeks.map((week) => {
                  const weekStartISO = formatDateISO(week[0]);
                  return (
                    <WeekRow
                      key={weekStartISO}
                      weekStartISO={weekStartISO}
                      selectionMode={selectionMode}
                      isHovered={weekHoverKey === weekStartISO}
                      onHoverChange={(next) => setWeekHoverKey(next ? weekStartISO : null)}
                      onSelect={(selectedWeekStartISO) => {
                        setSaveDialog({ scope: "WEEK", weekStartISO: selectedWeekStartISO });
                        setSelectionMode(null);
                        setWeekHoverKey(null);
                      }}
                      activeTemplateScope={activeTemplateScope}
                      isDraggingTemplate={isDraggingTemplate}
                    >
                      {week.map((date) => {
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
                            disableDrop={isDraggingTemplate || selectionMode !== null}
                            view={view}
                            items={dayItems}
                            onRemove={handleRemoveItem}
                            onViewRecipe={(recipeId) =>
                              updateParams({ recipeId, cookRecipeId: null, cookView: null })
                            }
                            onCookingView={(recipeId) =>
                              updateParams({
                                cookRecipeId: recipeId,
                                cookView: "1",
                                recipeId: null,
                              })
                            }
                          />
                        );
                      })}
                    </WeekRow>
                  );
                })}
              </div>
            </MonthDropZone>
          </div>
        </section>
      </main>

      {toastMessage ? (
        <div className="fixed bottom-6 right-6 z-40 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 shadow-lg">
          {toastMessage}
        </div>
      ) : null}

      {confirmPopover ? (
        <div className="pointer-events-none fixed inset-0 z-40">
          <div
            className="pointer-events-auto absolute w-60 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-700 shadow-lg"
            style={{ left: confirmPopover.position.x, top: confirmPopover.position.y }}
          >
            <p className="text-sm font-semibold text-slate-900">Replace meals?</p>
            <p className="mt-1 text-[11px] text-slate-500">
              This will replace meals in this {confirmPopover.target.scope === "WEEK" ? "week" : "month"}.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  const { templateId, target } = confirmPopover;
                  setConfirmPopover(null);
                  void applyTemplate(templateId, target, "REPLACE");
                }}
                className="w-full rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => {
                  const { templateId, target } = confirmPopover;
                  setConfirmPopover(null);
                  void applyTemplate(templateId, target, "MERGE_EMPTY");
                }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300"
              >
                Only fill empty days
              </button>
              <button
                type="button"
                onClick={() => setConfirmPopover(null)}
                className="w-full text-[11px] font-semibold text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {saveDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-base font-semibold text-slate-900">
              {saveDialog.scope === "WEEK" ? "Save week as template" : "Save month as template"}
            </h2>
            <label className="mt-4 block text-xs font-semibold text-slate-600">
              Template name
            </label>
            <input
              autoFocus
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
              maxLength={60}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
            {templateError ? (
              <p className="mt-2 text-xs text-rose-500">{templateError}</p>
            ) : null}
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSaveDialog(null)}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSaveTemplate()}
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
              >
                {isTemplatePending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
        ) : activeTemplate ? (
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500">
              {activeTemplate.scope === "WEEK" ? "W" : "M"}
            </div>
            <div className="min-w-0">
              <p className="whitespace-normal break-words text-sm font-medium text-slate-900">
                {activeTemplate.name}
              </p>
              <p className="text-xs text-slate-500">{activeTemplate.scope} template</p>
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
