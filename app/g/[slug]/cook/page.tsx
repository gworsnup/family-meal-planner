import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import WorkspaceHeader from "../_components/WorkspaceHeader";
import CookClient from "./CookClient";
import { RecipeDetail } from "./types";

const SORT_FIELDS = [
  "updatedAt",
  "title",
  "rating",
  "totalTimeMinutes",
  "sourceName",
] as const;

type SortField = (typeof SORT_FIELDS)[number];

type SearchParams = Record<string, string | string[] | undefined>;

function getParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseView(value?: string) {
  return value === "grid" ? "grid" : "table";
}

function parseSort(value?: string): SortField {
  if (SORT_FIELDS.includes(value as SortField)) return value as SortField;
  return "updatedAt";
}

function defaultDirForSort(sort: SortField) {
  return sort === "title" || sort === "sourceName" ? "asc" : "desc";
}

function parseDir(value: string | undefined, sort: SortField) {
  if (value === "asc" || value === "desc") return value;
  return defaultDirForSort(sort);
}

function parseMinRating(value?: string) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return 0;
  return Math.min(5, Math.max(0, Math.floor(parsed)));
}

function parseBooleanFlag(value?: string) {
  return value === "1";
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

export default async function CookPage({
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
          current="recipes"
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
              <button
                className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30"
              >
                Unlock
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const view = parseView(getParam(resolvedSearchParams.view));
  const q = getParam(resolvedSearchParams.q) ?? "";
  const minRating = parseMinRating(getParam(resolvedSearchParams.minRating));
  const manualOnly = parseBooleanFlag(getParam(resolvedSearchParams.manual));
  const recipeId = getParam(resolvedSearchParams.recipeId);
  const cookRecipeId = getParam(resolvedSearchParams.cookRecipeId);
  const cookView = parseBooleanFlag(getParam(resolvedSearchParams.cookView));
  const sort = parseSort(getParam(resolvedSearchParams.sort));
  const dir = parseDir(getParam(resolvedSearchParams.dir), sort);

  const where: {
    workspaceId: string;
    title?: { contains: string; mode: "insensitive" };
    rating?: { gte: number };
    AND?: Array<{
      photoUrl?: { not: string | null };
      sourceUrl?: { equals: string | null } | null;
      OR?: Array<{ sourceUrl: { equals: string | null } | null }>;
      import?: { is: null };
    }>;
  } = {
    workspaceId: workspace.id,
  };

  if (q.trim()) {
    where.title = { contains: q.trim(), mode: "insensitive" };
  }

  if (minRating > 0) {
    where.rating = { gte: minRating };
  }

  if (manualOnly) {
    where.AND = [
      ...(where.AND ?? []),
      { OR: [{ sourceUrl: { equals: null } }, { sourceUrl: { equals: "" } }] },
      { import: { is: null } },
    ];
  }

  const recipes = await prisma.recipe.findMany({
    where,
    orderBy: { [sort]: dir },
    select: {
      id: true,
      title: true,
      photoUrl: true,
      rating: true,
      sourceName: true,
      sourceUrl: true,
      totalTimeMinutes: true,
      prepTimeMinutes: true,
      cookTimeMinutes: true,
      updatedAt: true,
      isPrivate: true,
    },
  });

  const listRecipes = recipes.map((recipe) => ({
    ...recipe,
    updatedAt: recipe.updatedAt.toISOString(),
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
    <div className="min-h-screen bg-white">
      <WorkspaceHeader
        slug={slug}
        workspaceName={workspace.name}
        workspaces={workspaces}
        current="recipes"
      />
      <main className="mx-auto max-w-7xl px-6 py-8 sm:px-8">
        <CookClient
          slug={slug}
          workspaceName={workspace.name}
          recipes={listRecipes}
          view={view}
          q={q}
          minRating={minRating}
          manualOnly={manualOnly}
          sort={sort}
          dir={dir}
          selectedRecipe={selectedRecipe}
          selectedCookingRecipe={selectedCookingRecipe}
        />
      </main>
    </div>
  );
}
