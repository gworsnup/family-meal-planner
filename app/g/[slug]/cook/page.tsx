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

  const cookieStore = await cookies();
  const authed = cookieStore.get(`wsp_${slug}`)?.value === "1";

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-50">
        <WorkspaceHeader slug={slug} workspaceName={workspace.name} current="recipes" />
        <div className="mx-auto max-w-md px-6 py-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
              <button
                className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
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
  const hasPhoto = parseBooleanFlag(getParam(resolvedSearchParams.hasPhoto));
  const privateOnly = parseBooleanFlag(getParam(resolvedSearchParams.private));
  const recipeId = getParam(resolvedSearchParams.recipeId);
  const sort = parseSort(getParam(resolvedSearchParams.sort));
  const dir = parseDir(getParam(resolvedSearchParams.dir), sort);

  const where: {
    workspaceId: string;
    title?: { contains: string; mode: "insensitive" };
    rating?: { gte: number };
    isPrivate?: boolean;
    AND?: Array<{ photoUrl?: { not: string | null } }>;
  } = {
    workspaceId: workspace.id,
  };

  if (q.trim()) {
    where.title = { contains: q.trim(), mode: "insensitive" };
  }

  if (minRating > 0) {
    where.rating = { gte: minRating };
  }

  if (hasPhoto) {
    where.AND = [
      ...(where.AND ?? []),
      { photoUrl: { not: null } },
      { photoUrl: { not: "" } },
    ];
  }

  if (privateOnly) {
    where.isPrivate = true;
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
    const recipe = await prisma.recipe.findFirst({
      where: { id: recipeId, workspaceId: workspace.id },
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

    if (recipe) {
      selectedRecipe = {
        ...recipe,
        createdAt: recipe.createdAt.toISOString(),
        updatedAt: recipe.updatedAt.toISOString(),
      };
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <WorkspaceHeader slug={slug} workspaceName={workspace.name} current="recipes" />
      <main className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">Recipes</h1>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
              {workspace.name}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Browse, import, and organize your favorite recipes.
          </p>
        </div>

        <CookClient
          slug={slug}
          recipes={listRecipes}
          view={view}
          q={q}
          minRating={minRating}
          hasPhoto={hasPhoto}
          privateOnly={privateOnly}
          sort={sort}
          dir={dir}
          selectedRecipe={selectedRecipe}
        />
      </main>
    </div>
  );
}
