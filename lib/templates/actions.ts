"use server";

import { MealTemplateItemKind } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireWorkspaceUser } from "@/lib/auth";
import {
  addDays,
  endOfMonth,
  formatDateISO,
  parseDateISO,
  startOfMonth,
  startOfWeek,
} from "@/lib/planDates";

const MAX_TEMPLATE_NAME_LENGTH = 60;
const TAKEAWAY_TITLE = "Take Away Night";

export type MealTemplateScope = "WEEK" | "MONTH";
export type MealTemplateMode = "REPLACE" | "MERGE_EMPTY";

export type MealTemplateSummary = {
  id: string;
  name: string;
  scope: MealTemplateScope;
  itemCount: number;
};

export type CreateMealTemplateInput = {
  slug: string;
  name: string;
  scope: MealTemplateScope;
  weekStartISO?: string;
  monthStartISO?: string;
};

export type ApplyMealTemplateInput = {
  slug: string;
  templateId: string;
  target:
    | { scope: "WEEK"; weekStartISO: string }
    | { scope: "MONTH"; monthStartISO: string };
  mode: MealTemplateMode;
};

function normalizeDate(dateISO: string) {
  const parsed = parseDateISO(dateISO);
  if (!parsed) throw new Error("Invalid date");
  return parsed;
}

function daysBetween(start: Date, end: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((end.getTime() - start.getTime()) / msPerDay);
}

function getMonthGridRange(monthStart: Date) {
  const gridStart = startOfWeek(monthStart);
  const gridEnd = startOfWeek(endOfMonth(monthStart));
  return { gridStart, gridEnd: addDays(gridEnd, 6) };
}

async function bumpShoppingWeekVersion(workspaceId: string, date: Date) {
  const weekStart = startOfWeek(date);
  await prisma.shoppingListWeek.upsert({
    where: {
      workspaceId_weekStart: {
        workspaceId,
        weekStart,
      },
    },
    update: { version: { increment: 1 } },
    create: { workspaceId, weekStart, version: 1 },
  });
}

function buildMealSlots(dayIndexItems: Map<number, number>) {
  const counters = new Map<number, number>();
  return (dayIndex: number) => {
    const total = dayIndexItems.get(dayIndex) ?? 0;
    if (total <= 1) return null;
    const current = counters.get(dayIndex) ?? 0;
    counters.set(dayIndex, current + 1);
    return `slot-${current + 1}`;
  };
}

export async function createMealTemplateFromSelection({
  slug,
  name,
  scope,
  weekStartISO,
  monthStartISO,
}: CreateMealTemplateInput) {
  const user = await requireWorkspaceUser(slug);
  const trimmedName = name.trim();
  if (!trimmedName) {
    return { ok: false, error: "Name is required." } as const;
  }
  if (trimmedName.length > MAX_TEMPLATE_NAME_LENGTH) {
    return {
      ok: false,
      error: `Name must be ${MAX_TEMPLATE_NAME_LENGTH} characters or less.`,
    } as const;
  }

  let rangeStart: Date;
  let rangeEnd: Date;
  let gridStart: Date;

  if (scope === "WEEK") {
    if (!weekStartISO) {
      return { ok: false, error: "Week is required." } as const;
    }
    const weekStart = startOfWeek(normalizeDate(weekStartISO));
    rangeStart = weekStart;
    rangeEnd = addDays(weekStart, 6);
    gridStart = weekStart;
  } else {
    if (!monthStartISO) {
      return { ok: false, error: "Month is required." } as const;
    }
    const monthStart = startOfMonth(normalizeDate(monthStartISO));
    const { gridStart: monthGridStart, gridEnd } = getMonthGridRange(monthStart);
    rangeStart = monthGridStart;
    rangeEnd = gridEnd;
    gridStart = monthGridStart;
  }

  const planItems = await prisma.mealPlanItem.findMany({
    where: {
      workspaceId: user.workspace.id,
      date: {
        gte: rangeStart,
        lte: rangeEnd,
      },
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    select: { date: true, type: true, recipeId: true },
  });

  if (planItems.length === 0) {
    return { ok: false, error: "No meals found in that selection." } as const;
  }

  const dayCounts = new Map<number, number>();
  const templateItems = planItems.map((item) => {
    const dayIndex = daysBetween(gridStart, item.date);
    dayCounts.set(dayIndex, (dayCounts.get(dayIndex) ?? 0) + 1);
    return {
      dayIndex,
      kind: item.type === "TAKEAWAY" ? MealTemplateItemKind.TAKEAWAY : MealTemplateItemKind.RECIPE,
      recipeId: item.type === "RECIPE" ? item.recipeId : null,
    };
  });

  const getMealSlot = buildMealSlots(dayCounts);
  const itemsToCreate = templateItems.map((item) => ({
    dayIndex: item.dayIndex,
    kind: item.kind,
    recipeId: item.recipeId,
    mealSlot: getMealSlot(item.dayIndex),
  }));

  const template = await prisma.mealTemplate.create({
    data: {
      workspaceId: user.workspace.id,
      name: trimmedName,
      scope,
      items: { create: itemsToCreate },
    },
    select: {
      id: true,
      name: true,
      scope: true,
      _count: { select: { items: true } },
    },
  });

  return {
    ok: true,
    template: {
      id: template.id,
      name: template.name,
      scope: template.scope,
      itemCount: template._count.items,
    },
  } as const;
}

export async function applyMealTemplateToTarget({
  slug,
  templateId,
  target,
  mode,
}: ApplyMealTemplateInput) {
  const user = await requireWorkspaceUser(slug);

  const template = await prisma.mealTemplate.findFirst({
    where: { id: templateId, workspaceId: user.workspace.id },
    include: { items: true },
  });

  if (!template) {
    return { ok: false, error: "Template not found." } as const;
  }

  if (template.scope !== target.scope) {
    return { ok: false, error: "Template scope mismatch." } as const;
  }

  let rangeStart: Date;
  let rangeEnd: Date;
  let gridStart: Date;

  if (target.scope === "WEEK") {
    const weekStart = startOfWeek(normalizeDate(target.weekStartISO));
    rangeStart = weekStart;
    rangeEnd = addDays(weekStart, 6);
    gridStart = weekStart;
  } else {
    const monthStart = startOfMonth(normalizeDate(target.monthStartISO));
    const { gridStart: monthGridStart, gridEnd } = getMonthGridRange(monthStart);
    rangeStart = monthGridStart;
    rangeEnd = gridEnd;
    gridStart = monthGridStart;
  }

  const existingItems = await prisma.mealPlanItem.findMany({
    where: {
      workspaceId: user.workspace.id,
      date: {
        gte: rangeStart,
        lte: rangeEnd,
      },
    },
    select: { id: true, date: true, type: true },
  });

  const existingByDate = new Map<string, number>();
  existingItems.forEach((item) => {
    const key = formatDateISO(item.date);
    existingByDate.set(key, (existingByDate.get(key) ?? 0) + 1);
  });

  const recipeIds = template.items
    .filter((item) => item.kind === "RECIPE" && item.recipeId)
    .map((item) => item.recipeId!)
    .filter((id) => !!id);

  const recipes = recipeIds.length
    ? await prisma.recipe.findMany({
        where: { id: { in: recipeIds }, workspaceId: user.workspace.id },
        select: { id: true, title: true, photoUrl: true },
      })
    : [];

  const recipeMap = new Map(recipes.map((recipe) => [recipe.id, recipe]));

  let skipped = 0;
  type InsertItem = {
    date: Date;
    type: "RECIPE" | "TAKEAWAY";
    recipeId: string | null;
    title: string;
    photoUrl?: string | null;
    dateISO: string;
  };

  const itemsToInsert = template.items
    .map((item) => {
      const date = addDays(gridStart, item.dayIndex);
      if (date < rangeStart || date > rangeEnd) return null;
      const dateISO = formatDateISO(date);
      if (mode === "MERGE_EMPTY" && existingByDate.has(dateISO)) {
        return null;
      }
      if (item.kind === "TAKEAWAY") {
        return {
          date,
          type: "TAKEAWAY" as const,
          recipeId: null,
          title: TAKEAWAY_TITLE,
          dateISO,
        };
      }
      const recipe = item.recipeId ? recipeMap.get(item.recipeId) : null;
      if (!recipe) {
        skipped += 1;
        return null;
      }
      return {
        date,
        type: "RECIPE" as const,
        recipeId: recipe.id,
        title: recipe.title,
        photoUrl: recipe.photoUrl,
        dateISO,
      };
    })
    .filter((item): item is InsertItem => item !== null);

  const insertData = itemsToInsert.map((item) => ({
    workspaceId: user.workspace.id,
    recipeId: item.recipeId,
    date: item.date,
    type: item.type,
    title: item.title,
  }));

  await prisma.$transaction(async (tx) => {
    if (mode === "REPLACE") {
      await tx.mealPlanItem.deleteMany({
        where: {
          workspaceId: user.workspace.id,
          date: { gte: rangeStart, lte: rangeEnd },
        },
      });
    }

    if (insertData.length > 0) {
      await tx.mealPlanItem.createMany({ data: insertData });
    }
  });

  const weeksToBump = new Map<number, Date>();
  existingItems.forEach((item) => {
    if (item.type !== "RECIPE" || mode !== "REPLACE") return;
    const weekStart = startOfWeek(item.date);
    weeksToBump.set(weekStart.getTime(), weekStart);
  });
  itemsToInsert.forEach((item) => {
    if (item.type !== "RECIPE") return;
    const weekStart = startOfWeek(item.date);
    weeksToBump.set(weekStart.getTime(), weekStart);
  });

  for (const week of weeksToBump.values()) {
    await bumpShoppingWeekVersion(user.workspace.id, week);
  }

  const updatedItems = await prisma.mealPlanItem.findMany({
    where: {
      workspaceId: user.workspace.id,
      date: { gte: rangeStart, lte: rangeEnd },
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    include: { recipe: { select: { id: true, title: true, photoUrl: true } } },
  });

  const normalizedItems = updatedItems.map((item) => {
    if (item.type === "TAKEAWAY") {
      return {
        id: item.id,
        dateISO: formatDateISO(item.date),
        recipeId: null,
        type: "TAKEAWAY" as const,
        title: item.title ?? TAKEAWAY_TITLE,
        photoUrl: null,
      };
    }
    return {
      id: item.id,
      dateISO: formatDateISO(item.date),
      recipeId: item.recipeId ?? "",
      type: "RECIPE" as const,
      title: item.recipe?.title ?? item.title ?? "Recipe",
      photoUrl: item.recipe?.photoUrl ?? null,
    };
  });

  return {
    ok: true,
    items: normalizedItems,
    skipped,
  } as const;
}

export async function deleteMealTemplate({
  slug,
  templateId,
}: {
  slug: string;
  templateId: string;
}) {
  const user = await requireWorkspaceUser(slug);
  await prisma.mealTemplate.deleteMany({
    where: { id: templateId, workspaceId: user.workspace.id },
  });
}
