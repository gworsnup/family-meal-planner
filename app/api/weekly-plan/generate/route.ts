import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateMealPlan, type MealPlanSlot } from "@/lib/weeklyPlanGenerator";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const slug = body?.slug as string | undefined;
  const prompt = (body?.prompt as string | undefined)?.trim() ?? "";
  const scope = body?.scope === "month" ? "month" : "week";
  const targetStartISO = body?.targetStartISO as string | undefined;

  if (!slug || !prompt || !targetStartISO || !/^\d{4}-\d{2}-\d{2}$/.test(targetStartISO)) {
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
  type RecipeRow = (typeof recipes)[number];

  if (recipes.length < 7) {
    return NextResponse.json({ error: "Add at least 7 recipes to your library before generating a plan." }, { status: 400 });
  }

  try {
    const [year, month, day] = targetStartISO.split("-").map(Number);
    const targetStart = new Date(Date.UTC(year, month - 1, day));
    if (
      Number.isNaN(targetStart.getTime()) ||
      targetStart.getUTCFullYear() !== year ||
      targetStart.getUTCMonth() !== month - 1 ||
      targetStart.getUTCDate() !== day ||
      (scope === "month" && day !== 1)
    ) {
      return NextResponse.json({ error: "Invalid plan date" }, { status: 400 });
    }
    const dayCount = scope === "month" ? new Date(Date.UTC(year, month, 0)).getUTCDate() : 7;
    const slots: MealPlanSlot[] = Array.from({ length: dayCount }, (_, index) => {
      const date = new Date(targetStart);
      date.setUTCDate(date.getUTCDate() + index);
      const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" }).format(date);
      return {
        dayIndex: index + 1,
        dateISO: date.toISOString().slice(0, 10),
        weekday,
        isWeekend: weekday === "Saturday" || weekday === "Sunday",
      };
    });

    const plan = await generateMealPlan({
      workspaceSlug: workspace.slug,
      scope,
      prompt,
      slots,
      recipes: recipes.map((recipe: RecipeRow) => ({
        id: recipe.id,
        title: recipe.title,
        tags: recipe.recipeTags.map((tagRow: RecipeRow["recipeTags"][number]) => tagRow.tag.name),
        ingredients: recipe.ingredientLines
          .slice(0, 12)
          .map((line: RecipeRow["ingredientLines"][number]) => line.ingredient),
        servings: recipe.servings,
        prepTimeMinutes: recipe.prepTimeMinutes,
        cookTimeMinutes: recipe.cookTimeMinutes,
        description: recipe.description,
      })),
    });

    return NextResponse.json({
      plan,
      warning:
        recipes.length < (scope === "month" ? 31 : 14)
          ? "You’ll get better suggestions once you have more recipes saved."
          : null,
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    console.error("[Meal Plan API] generation failed", {
      slug,
      scope,
      targetStartISO,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error: timedOut
          ? "FamilyTable couldn’t generate this plan within a minute. Please try again—the same prompt is fine."
          : "FamilyTable couldn’t generate this plan. Please try again—the same prompt is fine.",
      },
      { status: 500 },
    );
  }
}
