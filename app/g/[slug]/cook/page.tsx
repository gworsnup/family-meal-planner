import type { Prisma } from "@prisma/client";
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

function formatSourceLabel(sourceName?: string | null, sourceUrl?: string | null) {
  if (sourceName?.trim()) return sourceName.trim();
  if (sourceUrl) {
    try {
      const url = new URL(sourceUrl);
      return url.hostname.replace(/^www\./, "");
    } catch {
      return sourceUrl;
    }
  }
  return null;
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

  const user = await getCurrentUser();
  const isAdmin = user?.isAdmin ?? false;

  const workspaces = isAdmin
    ? await prisma.workspace.findMany({
        select: { name: true, slug: true },
        orderBy: { name: "asc" },
      })
    : [];

  const view = parseView(getParam(resolvedSearchParams.view));
  const q = getParam(resolvedSearchParams.q) ?? "";
  const minRating = parseMinRating(getParam(resolvedSearchParams.minRating));
  const manualOnly = parseBooleanFlag(getParam(resolvedSearchParams.manual));
  const recipeId = getParam(resolvedSearchParams.recipeId);
  const cookRecipeId = getParam(resolvedSearchParams.cookRecipeId);
  const cookView = parseBooleanFlag(getParam(resolvedSearchParams.cookView));
  const sort = parseSort(getParam(resolvedSearchParams.sort));
  const dir = parseDir(getParam(resolvedSearchParams.dir), sort);
  const source = getParam(resolvedSearchParams.source) ?? "";

  const where: Prisma.RecipeWhereInput = {};
  where.workspaceId = workspace.id;
    const andFilters: Prisma.RecipeWhereInput[] = Array.isArray(where.AND)
      ? [...where.AND]
      : [];
      ...andFilters,
      const andFilters: Prisma.RecipeWhereInput[] = Array.isArray(where.AND)
        ? [...where.AND]
        : [];
        ...andFilters,
      const andFilters: Prisma.RecipeWhereInput[] = Array.isArray(where.AND)
        ? [...where.AND]
        : [];
      const orFilters: Prisma.RecipeWhereInput[] = [];
      orFilters.push({
        sourceName: { equals: source, mode: "insensitive" },
      });
      orFilters.push({
        sourceUrl: { contains: source, mode: "insensitive" },
      });
        ...andFilters,
          OR: orFilters,
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

  if (source) {
    if (source === "manual") {
      where.AND = [
        ...(where.AND ?? []),
        { OR: [{ sourceUrl: { equals: null } }, { sourceUrl: { equals: "" } }] },
        { import: { is: null } },
      ];
    } else {
      where.AND = [
        ...(where.AND ?? []),
        {
          OR: [
            { sourceName: { equals: source, mode: "insensitive" } },
            { sourceUrl: { contains: source, mode: "insensitive" } },
          ],
        },
      ];
    }
  }

  const sourceRows = await prisma.recipe.findMany({
    where: { workspaceId: workspace.id },
    select: {
      sourceName: true,
      sourceUrl: true,
      import: { select: { id: true } },
    },
  });

  const sourceMap = new Map<string, string>();
  let hasManualSource = false;
  sourceRows.forEach((row) => {
    const label = formatSourceLabel(row.sourceName, row.sourceUrl);
    if (label) {
      sourceMap.set(label.toLowerCase(), label);
    } else if (!row.import) {
      hasManualSource = true;
    }
  });

  const sourceOptions = [
    { label: "All sources", value: "" },
    ...Array.from(sourceMap.values())
      .sort((a, b) => a.localeCompare(b))
      .map((label) => ({ label, value: label })),
    ...(hasManualSource ? [{ label: "Manually Added", value: "manual" }] : []),
  ];

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
    <div className="min-h-screen bg-[#fcfcfc]">
      <WorkspaceHeader
        slug={slug}
        workspaceName={workspace.name}
        workspaces={workspaces}
        isAdmin={isAdmin}
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
          sourceFilter={source}
          sourceOptions={sourceOptions}
          selectedRecipe={selectedRecipe}
          selectedCookingRecipe={selectedCookingRecipe}
        />
      </main>
    </div>
  );
}
