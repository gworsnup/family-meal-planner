import "server-only";

import { prisma } from "@/lib/db";
import {
  isInstagramImageUrl,
  isTikTokImageUrl,
  persistInstagramImageToBlob,
  persistTiktokImageToBlob,
} from "@/lib/images/persistTiktokImageToBlob";
import { PlaywrightBlockedError } from "@/lib/importers/playwrightFetcher";
import { scrapeUrl } from "./scrapeUrl";

const BLOCKED_TITLE_REGEX = /(access denied|forbidden)/i;

function splitDirectionsToSteps(directions: string | null): string[] {
  if (!directions) return [];
  return directions
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function runRecipeImport(importId: string) {
  const record = await prisma.recipeImport.findUnique({
    where: { id: importId },
    include: {
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
      typeof scraped.title === "string" ? scraped.title.trim() : null;

    const instructionSteps = splitDirectionsToSteps(cleanedDirections);
    const isBlockedTitle = Boolean(cleanedTitle?.match(BLOCKED_TITLE_REGEX));

    if (
      !cleanedTitle ||
      isBlockedTitle ||
      (cleanedIngredients.length < 3 && instructionSteps.length < 2)
    ) {
      const message = isBlockedTitle
        ? "This site blocks automated importing. Please use another source link (e.g. Sainsbury’s Magazine) or add the recipe manually."
        : "I was not able to import this URL. Please try another URL.";
      await prisma.recipeImport.update({
        where: { id: importId },
        data: {
          status: "failed",
          error: message,
          importMethod: scraped.importMethod ?? "fetch",
          raw: scraped.raw ?? {},
        },
      });
      return;
    }

    const hasTitle = Boolean(cleanedTitle);
    const hasIngredients = cleanedIngredients.length > 0;
    const hasDirections = instructionSteps.length > 0;

    const status = (() => {
      if (hasTitle && (hasIngredients || hasDirections)) return "success";
      if (hasTitle || scraped.photoUrl || scraped.description) return "partial";
      return "failed";
    })();
    const statusError =
      status === "failed" ? "No usable recipe data found." : null;

    const createdRecipe = await prisma.$transaction(async (tx) => {
      const recipe = await tx.recipe.create({
        data: {
          workspaceId: record.workspaceId,
          title: cleanedTitle,
          sourceName: cleanedSourceName,
          sourceUrl: cleanedSourceUrl ?? record.sourceUrl,
          description: cleanedDescription,
          photoUrl: cleanedPhotoUrl ?? undefined,
          prepTimeMinutes: scraped.prepTimeMinutes ?? null,
          cookTimeMinutes: scraped.cookTimeMinutes ?? null,
          totalTimeMinutes: scraped.totalTimeMinutes ?? null,
          servings: scraped.servings ?? null,
          yields: scraped.yields ?? null,
          directions: cleanedDirections ?? null,
          isDraft: !(hasTitle && (hasIngredients || hasDirections)),
        },
      });

      if (hasIngredients) {
        await tx.ingredientLine.createMany({
          data: cleanedIngredients.map((line, index) => ({
            recipeId: recipe.id,
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
          importMethod: scraped.importMethod ?? "fetch",
          raw: scraped.raw ?? {},
          recipeId: recipe.id,
        },
      });

      return recipe;
    });

    let finalPhotoUrl = cleanedPhotoUrl;
    let imageSourceUrl: string | null = null;
    let imageStoredAt: Date | null = null;

    const sourceUrlForImage = cleanedSourceUrl ?? record.sourceUrl;
    const isTikTokSource = sourceUrlForImage?.includes("tiktok.com") ?? false;
    const isInstagramSource =
      sourceUrlForImage?.includes("instagram.com") ?? false;

    if (
      cleanedPhotoUrl &&
      isTikTokSource &&
      isTikTokImageUrl(cleanedPhotoUrl)
    ) {
      imageSourceUrl = cleanedPhotoUrl;
      try {
        const result = await persistTiktokImageToBlob({
          imageUrl: cleanedPhotoUrl,
          recipeId: createdRecipe.id,
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
          `[RecipeImage] Failed to persist TikTok image for recipe ${createdRecipe.id} (${hostname}). ${message}`,
        );
      }
    }

    if (
      cleanedPhotoUrl &&
      isInstagramSource &&
      isInstagramImageUrl(cleanedPhotoUrl)
    ) {
      imageSourceUrl = cleanedPhotoUrl;
      try {
        const result = await persistInstagramImageToBlob({
          imageUrl: cleanedPhotoUrl,
          recipeId: createdRecipe.id,
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
          `[RecipeImage] Failed to persist Instagram image for recipe ${createdRecipe.id} (${hostname}). ${message}`,
        );
      }
    }

    if (
      finalPhotoUrl !== cleanedPhotoUrl ||
      imageSourceUrl ||
      imageStoredAt
    ) {
      await prisma.recipe.update({
        where: { id: createdRecipe.id },
        data: {
          photoUrl: finalPhotoUrl ?? undefined,
          ...(imageSourceUrl ? { imageSourceUrl } : {}),
          ...(imageStoredAt ? { imageStoredAt } : {}),
        },
      });
    }
  } catch (error) {
    if (error instanceof PlaywrightBlockedError) {
      console.warn("[Scrape] playwright blocked", {
        finalUrl: error.finalUrl,
        title: error.pageTitle,
      });
      await prisma.recipeImport.update({
        where: { id: importId },
        data: {
          status: "failed",
          error:
            "This site blocks automated importing. Please use another source link (e.g. Sainsbury’s Magazine) or add the recipe manually.",
          importMethod: "playwright",
        },
      });
      return;
    }
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
