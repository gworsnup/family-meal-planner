import { prisma } from "@/lib/db";

export async function fetchRecipeDetailWithTiming(recipeId: string, workspaceId: string) {
  const queryStart = performance.now();
  console.info("[perf] prisma:recipeDetail:start", { recipeId, workspaceId, at: Date.now() });
  const recipe = await prisma.recipe.findFirst({
    where: { id: recipeId, workspaceId },
    select: {
      id: true,
      title: true,
      description: true,
      sourceName: true,
      sourceUrl: true,
      photoUrl: true,
      prepTimeMinutes: true,
      cookTimeMinutes: true,
      totalTimeMinutes: true,
      servings: true,
      yields: true,
      rating: true,
      directions: true,
      isPrivate: true,
      createdAt: true,
      updatedAt: true,
      recipeTags: {
        orderBy: { tag: { name: "asc" } },
        select: { tag: { select: { id: true, name: true } } },
      },
      ingredientLines: {
        orderBy: { position: "asc" },
        select: { id: true, ingredient: true, position: true },
      },
    },
  });
  console.info("[perf] prisma:recipeDetail:end", {
    recipeId,
    elapsedMs: Math.round(performance.now() - queryStart),
  });

  if (!recipe) return null;

  return {
    ...recipe,
    tags: recipe.recipeTags.map((recipeTag) => recipeTag.tag),
    createdAt: recipe.createdAt.toISOString(),
    updatedAt: recipe.updatedAt.toISOString(),
  };
}
