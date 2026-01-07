import "server-only";

import { prisma } from "@/lib/db";
import { scrapeUrl } from "./scrapeUrl";

export async function runRecipeImport(importId: string) {
  const record = await prisma.recipeImport.findUnique({
    where: { id: importId },
    include: {
      recipe: true,
      workspace: true,
    },
  });

  if (!record) {
    throw new Error("Import not found");
  }

  await prisma.recipeImport.update({
    where: { id: importId },
    data: { status: "running", error: null },
  });

  try {
    const scraped = await scrapeUrl(record.sourceUrl);

    const hasTitle = Boolean(scraped.title?.trim());
    const hasIngredients = (scraped.ingredients?.length ?? 0) > 0;
    const hasDirections = Boolean(scraped.directions?.trim());

    const status = (() => {
      if (hasTitle && (hasIngredients || hasDirections)) return "success";
      if (hasTitle || scraped.photoUrl || scraped.description) return "partial";
      return "failed";
    })();
    const statusError =
      status === "failed" ? "No usable recipe data found." : null;

    await prisma.$transaction(async (tx) => {
      await tx.recipe.update({
        where: { id: record.recipeId },
        data: {
          title: scraped.title?.trim() || record.recipe.title,
          sourceName: scraped.sourceName ?? record.recipe.sourceName,
          sourceUrl: scraped.sourceUrl ?? record.sourceUrl,
          description: scraped.description ?? record.recipe.description,
          photoUrl: scraped.photoUrl ?? record.recipe.photoUrl,
          prepTimeMinutes: scraped.prepTimeMinutes ?? record.recipe.prepTimeMinutes,
          cookTimeMinutes: scraped.cookTimeMinutes ?? record.recipe.cookTimeMinutes,
          totalTimeMinutes: scraped.totalTimeMinutes ?? record.recipe.totalTimeMinutes,
          servings: scraped.servings ?? record.recipe.servings,
          yields: scraped.yields ?? record.recipe.yields,
          directions: scraped.directions ?? record.recipe.directions,
          isDraft: !(hasTitle && (hasIngredients || hasDirections)),
        },
      });

      await tx.ingredientLine.deleteMany({ where: { recipeId: record.recipeId } });

      if (hasIngredients && scraped.ingredients) {
        await tx.ingredientLine.createMany({
          data: scraped.ingredients.map((line, index) => ({
            recipeId: record.recipeId,
            position: index + 1,
            ingredient: line,
          })),
        });
      }

      await tx.recipeImport.update({
        where: { id: importId },
        data: {
          status,
          error: statusError,
          raw: scraped.raw ?? {},
        },
      });
    });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "";
    const statusMatch = rawMessage.match(/HTTP\s(\d{3})/i);
    const message = statusMatch
      ? `I was not able to import this URL (HTTP status ${statusMatch[1]}). Please try another URL.`
      : error instanceof Error
        ? error.message
        : "Import failed unexpectedly";
    await prisma.recipeImport.update({
      where: { id: importId },
      data: {
        status: "failed",
        error: message,
      },
    });
    throw error;
  }
}
