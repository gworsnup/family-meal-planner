"use server";

import { prisma } from "@/lib/db";
import { requireWorkspaceUser } from "@/lib/auth";
import { normalizeTagName } from "@/lib/normalizeTagName";
import { revalidatePath } from "next/cache";
import { UpdateRecipeInput } from "./types";

const MAX_RATING = 5;
const MIN_RATING = 0;

type TagSummary = {
  id: string;
  name: string;
};

function formatTagName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

async function getRecipeTags(recipeId: string) {
  const recipeTags = await prisma.recipeTag.findMany({
    where: { recipeId },
    orderBy: { tag: { name: "asc" } },
    select: {
      tag: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  return recipeTags.map((recipeTag) => recipeTag.tag);
}

export async function setRecipeRating(
  slug: string,
  recipeId: string,
  rating: number,
) {
  const user = await requireWorkspaceUser(slug);

  if (!Number.isInteger(rating) || rating < MIN_RATING || rating > MAX_RATING) {
    throw new Error("Invalid rating");
  }

  const updateResult = await prisma.recipe.updateMany({
    where: { id: recipeId, workspaceId: user.workspace.id },
    data: { rating },
  });

  if (updateResult.count === 0) {
    throw new Error("Recipe not found");
  }
}

export async function deleteRecipe(slug: string, recipeId: string) {
  const user = await requireWorkspaceUser(slug);

  const deleted = await prisma.recipe.deleteMany({
    where: {
      id: recipeId,
      workspaceId: user.workspace.id,
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
  const user = await requireWorkspaceUser(slug);

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

  const numericFields: Array<
    keyof Pick<UpdateRecipeInput, "prepTimeMinutes" | "cookTimeMinutes" | "totalTimeMinutes">
  > = [
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
      where: { id: recipeId, workspaceId: user.workspace.id },
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

export async function getWorkspaceTags(slug: string): Promise<TagSummary[]> {
  const user = await requireWorkspaceUser(slug);
  return prisma.tag.findMany({
    where: { workspaceId: user.workspace.id },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
    },
  });
}

export async function createTag(slug: string, name: string): Promise<TagSummary> {
  const user = await requireWorkspaceUser(slug);
  const normalized = normalizeTagName(name);
  if (!normalized) {
    throw new Error("Tag name is required");
  }
  const formattedName = formatTagName(name);

  const tag = await prisma.tag.upsert({
    where: {
      workspaceId_nameNormalized: {
        workspaceId: user.workspace.id,
        nameNormalized: normalized,
      },
    },
    create: {
      workspaceId: user.workspace.id,
      name: formattedName,
      nameNormalized: normalized,
    },
    update: {},
    select: {
      id: true,
      name: true,
    },
  });

  revalidatePath(`/g/${slug}/cook`);
  revalidatePath(`/g/${slug}/plan`);

  return tag;
}

export async function deleteTag(slug: string, tagId: string) {
  const user = await requireWorkspaceUser(slug);

  const deleted = await prisma.tag.deleteMany({
    where: { id: tagId, workspaceId: user.workspace.id },
  });

  if (deleted.count === 0) {
    throw new Error("Tag not found");
  }

  revalidatePath(`/g/${slug}/cook`);
  revalidatePath(`/g/${slug}/plan`);
}

export async function toggleRecipeTag(
  slug: string,
  recipeId: string,
  tagId: string,
  enabled: boolean,
): Promise<TagSummary[]> {
  const user = await requireWorkspaceUser(slug);

  const [recipe, tag] = await Promise.all([
    prisma.recipe.findFirst({
      where: { id: recipeId, workspaceId: user.workspace.id },
      select: { id: true },
    }),
    prisma.tag.findFirst({
      where: { id: tagId, workspaceId: user.workspace.id },
      select: { id: true },
    }),
  ]);

  if (!recipe || !tag) {
    throw new Error("Tag or recipe not found");
  }

  if (enabled) {
    await prisma.recipeTag.upsert({
      where: { recipeId_tagId: { recipeId, tagId } },
      create: { recipeId, tagId },
      update: {},
    });
  } else {
    await prisma.recipeTag.deleteMany({ where: { recipeId, tagId } });
  }

  revalidatePath(`/g/${slug}/cook`);
  revalidatePath(`/g/${slug}/plan`);

  return getRecipeTags(recipeId);
}

export async function addOrCreateTagToRecipe(
  slug: string,
  recipeId: string,
  tagName: string,
): Promise<{ tag: TagSummary; recipeTags: TagSummary[] }> {
  const user = await requireWorkspaceUser(slug);
  const normalized = normalizeTagName(tagName);
  if (!normalized) {
    throw new Error("Tag name is required");
  }
  const formattedName = formatTagName(tagName);

  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, workspaceId: user.workspace.id },
    select: { id: true },
  });
  if (!recipe) {
    throw new Error("Recipe not found");
  }

  const tag = await prisma.tag.upsert({
    where: {
      workspaceId_nameNormalized: {
        workspaceId: user.workspace.id,
        nameNormalized: normalized,
      },
    },
    create: {
      workspaceId: user.workspace.id,
      name: formattedName,
      nameNormalized: normalized,
    },
    update: {},
    select: {
      id: true,
      name: true,
    },
  });

  await prisma.recipeTag.upsert({
    where: { recipeId_tagId: { recipeId, tagId: tag.id } },
    create: { recipeId, tagId: tag.id },
    update: {},
  });

  revalidatePath(`/g/${slug}/cook`);
  revalidatePath(`/g/${slug}/plan`);

  return { tag, recipeTags: await getRecipeTags(recipeId) };
}
