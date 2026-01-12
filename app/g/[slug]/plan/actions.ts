"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseDateISO, startOfWeek } from "@/lib/planDates";
import { requireWorkspaceUser } from "@/lib/auth";

type AddMealPlanInput = {
  slug: string;
  dateISO: string;
  recipeId: string;
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
}: AddMealPlanInput) {
  const user = await requireWorkspaceUser(slug);

  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, workspaceId: user.workspace.id },
    select: { id: true, title: true, photoUrl: true },
  });

  if (!recipe) {
    throw new Error("Recipe not found");
  }

  const date = normalizeDate(dateISO);

  try {
    const item = await prisma.mealPlanItem.create({
      data: {
        workspaceId: user.workspace.id,
        recipeId: recipe.id,
        date,
      },
      select: { id: true, date: true, recipeId: true },
    });

    await bumpShoppingWeekVersion(user.workspace.id, date);

    return {
      item: {
        id: item.id,
        dateISO,
        recipeId: item.recipeId,
        title: recipe.title,
        photoUrl: recipe.photoUrl,
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
    select: { id: true, date: true },
  });

  if (!existing) {
    throw new Error("Meal plan item not found");
  }

  await prisma.mealPlanItem.deleteMany({
    where: { id: itemId, workspaceId: user.workspace.id },
  });

  await bumpShoppingWeekVersion(user.workspace.id, existing.date);
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
    select: { id: true, date: true },
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

  const previousWeekStart = startOfWeek(existing.date).getTime();
  const nextWeekStart = startOfWeek(date).getTime();
  if (previousWeekStart === nextWeekStart) {
    await bumpShoppingWeekVersion(user.workspace.id, date);
  } else {
    await bumpShoppingWeekVersion(user.workspace.id, existing.date);
    await bumpShoppingWeekVersion(user.workspace.id, date);
  }

  return { itemId, dateISO };
}
