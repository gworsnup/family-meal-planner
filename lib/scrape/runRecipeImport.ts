import "server-only";

import { prisma } from "@/lib/db";
import {
  isTikTokImageUrl,
  persistTiktokImageToBlob,
} from "@/lib/images/persistTiktokImageToBlob";
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
    if (!record.recipe.isDraft) {
      await prisma.recipeImport.update({
        where: { id: importId },
        data: {
          status: "failed",
          error: "Import skipped because the recipe was already edited.",
        },
      });
      return;
    }

    const scraped = await scrapeUrl(record.sourceUrl);
    const cleanedIngredients = (scraped.ingredients ?? [])
      .filter((line) => typeof line === "string")
      .map((line) => line.trim())
      .filter(Boolean);
    const cleanedPhotoUrl =
      typeof scraped.photoUrl === "string" ? scraped.photoUrl : null;
    const cleanedSourceUrl =
      typeof scraped.sourceUrl === "string" ? scraped.sourceUrl : null;
    const cleanedSourceName =
      typeof scraped.sourceName === "string" ? scraped.sourceName : null;
    const cleanedDescription =
      typeof scraped.description === "string" ? scraped.description : null;
    const cleanedDirections =
      typeof scraped.directions === "string" ? scraped.directions : null;
    const cleanedTitle =
      typeof scraped.title === "string" ? scraped.title : null;

    let finalPhotoUrl = cleanedPhotoUrl ?? record.recipe.photoUrl;
    let imageSourceUrl: string | null = null;
    let imageStoredAt: Date | null = null;

    if (cleanedPhotoUrl && isTikTokImageUrl(cleanedPhotoUrl)) {
      imageSourceUrl = cleanedPhotoUrl;
      try {
        const result = await persistTiktokImageToBlob({
          imageUrl: cleanedPhotoUrl,
          recipeId: record.recipeId,
          slug: record.workspace.slug,
        });
        if (result.didPersist) {
          finalPhotoUrl = result.finalUrl;
          imageStoredAt = new Date();
        }
      } catch (error) {
        const hostname = (() => {
          try {
            return new URL(cleanedPhotoUrl).hostname;
          } catch {
            return "unknown-host";
          }
        })();
        const message = error instanceof Error ? error.message : "Unknown error";
        console.warn(
          `[RecipeImage] Failed to persist TikTok image for recipe ${record.recipeId} (${hostname}). ${message}`,
        );
      }
    }

    const hasTitle = Boolean(cleanedTitle?.trim());
    const hasIngredients = cleanedIngredients.length > 0;
    const hasDirections = Boolean(cleanedDirections?.trim());

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
          title: cleanedTitle?.trim() || record.recipe.title,
          sourceName: cleanedSourceName ?? record.recipe.sourceName,
          sourceUrl: cleanedSourceUrl ?? record.sourceUrl,
          description: cleanedDescription ?? record.recipe.description,
          photoUrl: finalPhotoUrl,
          ...(imageSourceUrl ? { imageSourceUrl } : {}),
          ...(imageStoredAt ? { imageStoredAt } : {}),
          prepTimeMinutes: scraped.prepTimeMinutes ?? record.recipe.prepTimeMinutes,
          cookTimeMinutes: scraped.cookTimeMinutes ?? record.recipe.cookTimeMinutes,
          totalTimeMinutes: scraped.totalTimeMinutes ?? record.recipe.totalTimeMinutes,
          servings: scraped.servings ?? record.recipe.servings,
          yields: scraped.yields ?? record.recipe.yields,
          directions: cleanedDirections ?? record.recipe.directions,
          isDraft: !(hasTitle && (hasIngredients || hasDirections)),
        },
      });

      await tx.ingredientLine.deleteMany({ where: { recipeId: record.recipeId } });

      if (hasIngredients) {
        await tx.ingredientLine.createMany({
          data: cleanedIngredients.map((line, index) => ({
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
      : rawMessage.includes("Invalid `prisma.recipe.update`")
        ? "I was not able to import this URL. Please try another URL."
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
