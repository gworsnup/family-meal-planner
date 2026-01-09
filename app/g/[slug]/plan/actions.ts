"use server";

import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseDateISO } from "@/lib/planDates";

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

export async function addMealPlanItem({
  slug,
  dateISO,
  recipeId,
}: AddMealPlanInput) {
  const cookieStore = await cookies();
  const authed = cookieStore.get(`wsp_${slug}`)?.value === "1";

  if (!authed) {
    throw new Error("Unauthorized");
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, workspaceId: workspace.id },
    select: { id: true, title: true, photoUrl: true },
  });

  if (!recipe) {
    throw new Error("Recipe not found");
  }

  const date = normalizeDate(dateISO);

  try {
    const item = await prisma.mealPlanItem.create({
      data: {
        workspaceId: workspace.id,
        recipeId: recipe.id,
        date,
      },
      select: { id: true, date: true, recipeId: true },
    });

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
  const cookieStore = await cookies();
  const authed = cookieStore.get(`wsp_${slug}`)?.value === "1";

  if (!authed) {
    throw new Error("Unauthorized");
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  const deleted = await prisma.mealPlanItem.deleteMany({
    where: { id: itemId, workspaceId: workspace.id },
  });

  if (deleted.count === 0) {
    throw new Error("Meal plan item not found");
  }
}

export async function moveMealPlanItem({
  slug,
  itemId,
  dateISO,
}: MoveMealPlanInput) {
  const cookieStore = await cookies();
  const authed = cookieStore.get(`wsp_${slug}`)?.value === "1";

  if (!authed) {
    throw new Error("Unauthorized");
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  const date = normalizeDate(dateISO);

  const updated = await prisma.mealPlanItem.updateMany({
    where: { id: itemId, workspaceId: workspace.id },
    data: { date },
  });

  if (updated.count === 0) {
    throw new Error("Meal plan item not found");
  }

  return { itemId, dateISO };
}
