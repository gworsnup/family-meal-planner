import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchRecipeDetailWithTiming } from "@/lib/recipeDetail";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ recipeId: string }> },
) {
  const user = await getCurrentUser();
  if (!user?.workspace?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { recipeId } = await params;
  const routeStart = performance.now();
  console.info("[perf] api:recipe-detail:start", { recipeId, at: Date.now() });
  const recipe = await fetchRecipeDetailWithTiming(recipeId, user.workspace.id);
  console.info("[perf] api:recipe-detail:end", {
    recipeId,
    elapsedMs: Math.round(performance.now() - routeStart),
    found: Boolean(recipe),
  });

  if (!recipe) {
    const existsInWorkspace = await prisma.recipe.findFirst({
      where: { id: recipeId, workspaceId: user.workspace.id },
      select: { id: true },
    });
    if (!existsInWorkspace) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  return NextResponse.json({ recipe });
}
