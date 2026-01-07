"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { UpdateRecipeInput } from "./types";

const MAX_RATING = 5;
const MIN_RATING = 0;

export async function setRecipeRating(
  slug: string,
  recipeId: string,
  rating: number,
) {
  const cookieStore = await cookies();
  const authed = cookieStore.get(`wsp_${slug}`)?.value === "1";

  if (!authed) {
    throw new Error("Unauthorized");
  }

  if (!Number.isInteger(rating) || rating < MIN_RATING || rating > MAX_RATING) {
    throw new Error("Invalid rating");
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  const updateResult = await prisma.recipe.updateMany({
    where: { id: recipeId, workspaceId: workspace.id },
    data: { rating },
  });

  if (updateResult.count === 0) {
    throw new Error("Recipe not found");
  }
}

export async function deleteRecipe(slug: string, recipeId: string) {
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

  const deleted = await prisma.recipe.deleteMany({
    where: {
      id: recipeId,
      workspaceId: workspace.id,
    },
  });

  if (deleted.count === 0) {
    throw new Error("Recipe not found");
  }
}

export async function updateRecipe(
  slug: string,
  recipeId: string,
  data: UpdateRecipeInput,
) {
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

  if (!data.title.trim()) {
    throw new Error("Title is required");
  }

  if (
    data.rating !== null &&
    (!Number.isInteger(data.rating) ||
      data.rating < MIN_RATING ||
      data.rating > MAX_RATING)
  ) {
    throw new Error("Invalid rating");
  }

  const numericFields: Array<keyof UpdateRecipeInput> = [
    "prepTimeMinutes",
    "cookTimeMinutes",
    "totalTimeMinutes",
  ];

  numericFields.forEach((field) => {
    const value = data[field];
    if (value === null || value === undefined) return;
    if (!Number.isInteger(value) || value < 0) {
      throw new Error("Invalid time value");
    }
  });

  const ingredientLines = data.ingredientsText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  await prisma.$transaction(async (tx) => {
    const updated = await tx.recipe.updateMany({
      where: { id: recipeId, workspaceId: workspace.id },
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        sourceName: data.sourceName?.trim() || null,
        sourceUrl: data.sourceUrl?.trim() || null,
        photoUrl: data.photoUrl?.trim() || null,
        directions: data.directions?.trim() || null,
        prepTimeMinutes: data.prepTimeMinutes ?? null,
        cookTimeMinutes: data.cookTimeMinutes ?? null,
        totalTimeMinutes: data.totalTimeMinutes ?? null,
        servings: data.servings?.trim() || null,
        yields: data.yields?.trim() || null,
        rating: data.rating,
        isPrivate: data.isPrivate,
      },
    });

    if (updated.count === 0) {
      throw new Error("Recipe not found");
    }

    await tx.ingredientLine.deleteMany({
      where: { recipeId },
    });

    if (ingredientLines.length > 0) {
      await tx.ingredientLine.createMany({
        data: ingredientLines.map((line, index) => ({
          recipeId,
          position: index + 1,
          ingredient: line,
        })),
      });
    }
  });
}
