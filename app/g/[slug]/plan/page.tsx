import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import WorkspaceHeader from "../_components/WorkspaceHeader";
import PlanClient from "./PlanClient";
import {
  addDays,
  formatDateISO,
  getTodayUTC,
  getViewRange,
  parseDateISO,
  type PlanView,
} from "@/lib/planDates";
import { RecipeDetail } from "../cook/types";

type SearchParams = Record<string, string | string[] | undefined>;

function getParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseView(value?: string): PlanView {
  return value === "week" ? "week" : "month";
}

function parseFocusedDate(value?: string) {
  if (!value) return getTodayUTC();
  return parseDateISO(value) ?? getTodayUTC();
}

async function fetchRecipeDetail(recipeId: string, workspaceId: string) {
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
      ingredientLines: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          ingredient: true,
          position: true,
        },
      },
    },
  });

  if (!recipe) return null;

  return {
    ...recipe,
    createdAt: recipe.createdAt.toISOString(),
    updatedAt: recipe.updatedAt.toISOString(),
  };
}

export default async function PlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;

  const workspace = await prisma.workspace.findUnique({ where: { slug } });
  if (!workspace) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10 text-slate-700">
        Workspace not found.
      </div>
    );
  }

  const workspaces = await prisma.workspace.findMany({
    select: { name: true, slug: true },
    orderBy: { name: "asc" },
  });

  const cookieStore = await cookies();
  const authed = cookieStore.get(`wsp_${slug}`)?.value === "1";

  if (!authed) {
    return (
      <div className="min-h-screen bg-white">
        <WorkspaceHeader
          slug={slug}
          workspaceName={workspace.name}
          workspaces={workspaces}
          current="plan"
        />
        <div className="mx-auto max-w-md px-6 py-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h1 className="text-xl font-semibold text-slate-900">
              {workspace.name}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Enter passcode to continue.
            </p>

            <form
              action={`/api/workspace/${slug}/login`}
              method="post"
              className="mt-6 space-y-3"
            >
              <input
                name="passcode"
                type="password"
                placeholder="Passcode"
                autoFocus
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              />
              <button className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30">
                Unlock
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const view = parseView(getParam(resolvedSearchParams.view));
  const focusedDate = parseFocusedDate(getParam(resolvedSearchParams.date));
  const focusedDateISO = formatDateISO(focusedDate);
  const recipeId = getParam(resolvedSearchParams.recipeId);
  const cookRecipeId = getParam(resolvedSearchParams.cookRecipeId);
  const cookView = getParam(resolvedSearchParams.cookView) === "1";
  const { start, end } = getViewRange(view, focusedDate);
  const endExclusive = addDays(end, 1);

  const recipes = await prisma.recipe.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      sourceName: true,
      sourceUrl: true,
      photoUrl: true,
      rating: true,
      updatedAt: true,
    },
  });

  const planItems = await prisma.mealPlanItem.findMany({
    where: {
      workspaceId: workspace.id,
      date: {
        gte: start,
        lt: endExclusive,
      },
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    include: {
      recipe: {
        select: {
          id: true,
          title: true,
          photoUrl: true,
        },
      },
    },
  });

  const serializedRecipes = recipes.map((recipe) => ({
    ...recipe,
    updatedAt: recipe.updatedAt.toISOString(),
  }));

  const serializedPlanItems = planItems.map((item) => ({
    id: item.id,
    dateISO: formatDateISO(item.date),
    recipeId: item.recipeId,
    title: item.recipe.title,
    photoUrl: item.recipe.photoUrl,
  }));

  let selectedRecipe: RecipeDetail | null = null;
  if (recipeId) {
    selectedRecipe = await fetchRecipeDetail(recipeId, workspace.id);
  }

  let selectedCookingRecipe: RecipeDetail | null = null;
  if (cookView && cookRecipeId) {
    selectedCookingRecipe = await fetchRecipeDetail(cookRecipeId, workspace.id);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <WorkspaceHeader
        slug={slug}
        workspaceName={workspace.name}
        workspaces={workspaces}
        current="plan"
      />
      <PlanClient
        slug={slug}
        workspaceName={workspace.name}
        recipes={serializedRecipes}
        planItems={serializedPlanItems}
        view={view}
        focusedDateISO={focusedDateISO}
        selectedRecipe={selectedRecipe}
        selectedCookingRecipe={selectedCookingRecipe}
      />
    </div>
  );
}
