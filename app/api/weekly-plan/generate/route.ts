import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateWeeklyPlan } from "@/lib/weeklyPlanGenerator";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const slug = body?.slug as string | undefined;
  const prompt = (body?.prompt as string | undefined)?.trim() ?? "";

  if (!slug || !prompt) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await prisma.workspace.findUnique({ where: { slug }, select: { id: true, slug: true } });
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  if (!user.isAdmin && user.workspace?.id !== workspace.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const recipes = await prisma.recipe.findMany({
    where: { workspaceId: workspace.id },
    select: {
      id: true,
      title: true,
      description: true,
      servings: true,
      prepTimeMinutes: true,
      cookTimeMinutes: true,
      ingredientLines: { orderBy: { position: "asc" }, select: { ingredient: true } },
      recipeTags: { select: { tag: { select: { name: true } } } },
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  if (recipes.length < 7) {
    return NextResponse.json({ error: "Add at least 7 recipes to your library before generating a weekly plan." }, { status: 400 });
  }

  try {
    const plan = await generateWeeklyPlan({
      workspaceSlug: workspace.slug,
      prompt,
      recipes: recipes.map((recipe) => ({
        id: recipe.id,
        title: recipe.title,
        tags: recipe.recipeTags.map((x) => x.tag.name),
        ingredients: recipe.ingredientLines.slice(0, 12).map((x) => x.ingredient),
        servings: recipe.servings,
        prepTimeMinutes: recipe.prepTimeMinutes,
        cookTimeMinutes: recipe.cookTimeMinutes,
        description: recipe.description,
      })),
    });

    return NextResponse.json({
      plan,
      warning:
        recipes.length < 14
          ? "You’ll get better suggestions once you have more recipes saved."
          : null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          "Sorry, FamilyTable couldn’t generate a plan this time. Try simplifying your prompt or adding more recipes.",
      },
      { status: 500 },
    );
  }
}
