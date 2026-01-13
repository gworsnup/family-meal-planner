"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseDateISO, startOfWeek } from "@/lib/planDates";
import { requireWorkspaceUser } from "@/lib/auth";

type AddMealPlanInput = {
  slug: string;
  dateISO: string;
  recipeId?: string | null;
  type?: "RECIPE" | "TAKEAWAY";
};

type RemoveMealPlanInput = {
  slug: string;
  itemId: string;
};

type MoveMealPlanInput = {
  slug: string;
  itemId: string;
  dateISO: string;
};

function normalizeDate(dateISO: string) {
  const date = parseDateISO(dateISO);
  if (!date) {
    throw new Error("Invalid date");
  }
  return date;
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
    update: {
      version: { increment: 1 },
    },
    create: {
      workspaceId,
      weekStart,
      version: 1,
    },
  });
}

export async function addMealPlanItem({
  slug,
  dateISO,
  recipeId,
  type = "RECIPE",
}: AddMealPlanInput) {
  const user = await requireWorkspaceUser(slug);

  if (type === "RECIPE" && !recipeId) {
    throw new Error("Recipe is required");
  }

  if (type === "TAKEAWAY" && recipeId) {
    throw new Error("Recipe not allowed for takeaway items");
  }

  const recipe =
    type === "RECIPE"
      ? await prisma.recipe.findFirst({
          where: { id: recipeId, workspaceId: user.workspace.id },
          select: { id: true, title: true, photoUrl: true },
        })
      : null;

  if (type === "RECIPE" && !recipe) {
    throw new Error("Recipe not found");
  }

  const date = normalizeDate(dateISO);
  const title = type === "TAKEAWAY" ? "Take Away Night" : recipe?.title ?? "Recipe";

  try {
    const item = await prisma.mealPlanItem.create({
      data: {
        workspaceId: user.workspace.id,
        recipeId: recipe?.id ?? null,
        date,
        type,
        title,
      },
      select: { id: true, date: true, recipeId: true, type: true, title: true },
    });

    if (type === "RECIPE") {
      await bumpShoppingWeekVersion(user.workspace.id, date);
    }

    return {
      item: {
        id: item.id,
        dateISO,
        recipeId: item.recipeId,
        type: item.type,
        title: item.title ?? title,
        photoUrl: recipe?.photoUrl ?? null,
      },
    };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { item: null };
    }
    throw error;
  }
}

export async function removeMealPlanItem({
  slug,
  itemId,
}: RemoveMealPlanInput) {
  const user = await requireWorkspaceUser(slug);

  const existing = await prisma.mealPlanItem.findFirst({
    where: { id: itemId, workspaceId: user.workspace.id },
    select: { id: true, date: true, type: true },
  });

  if (!existing) {
    throw new Error("Meal plan item not found");
  }

  await prisma.mealPlanItem.deleteMany({
    where: { id: itemId, workspaceId: user.workspace.id },
  });

  if (existing.type === "RECIPE") {
    await bumpShoppingWeekVersion(user.workspace.id, existing.date);
  }
}

export async function moveMealPlanItem({
  slug,
  itemId,
  dateISO,
}: MoveMealPlanInput) {
  const user = await requireWorkspaceUser(slug);

  const date = normalizeDate(dateISO);

  const existing = await prisma.mealPlanItem.findFirst({
    where: { id: itemId, workspaceId: user.workspace.id },
    select: { id: true, date: true, type: true },
  });

  if (!existing) {
    throw new Error("Meal plan item not found");
  }

  const updated = await prisma.mealPlanItem.updateMany({
    where: { id: itemId, workspaceId: user.workspace.id },
    data: { date },
  });

  if (updated.count === 0) {
    throw new Error("Meal plan item not found");
  }

  if (existing.type === "RECIPE") {
    const previousWeekStart = startOfWeek(existing.date).getTime();
    const nextWeekStart = startOfWeek(date).getTime();
    if (previousWeekStart === nextWeekStart) {
      await bumpShoppingWeekVersion(user.workspace.id, date);
    } else {
      await bumpShoppingWeekVersion(user.workspace.id, existing.date);
      await bumpShoppingWeekVersion(user.workspace.id, date);
    }
  }

  return { itemId, dateISO };
}
