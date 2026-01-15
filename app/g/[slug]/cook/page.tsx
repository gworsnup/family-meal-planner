import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
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

type SourceOption = {
  label: string;
  value: string;
};

function getParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

async function fetchRecipeTitle(recipeId: string, slug: string) {
  const recipe = await prisma.recipe.findFirst({
    where: {
      id: recipeId,
      workspace: {
        slug,
      },
    },
    select: {
      title: true,
    },
  });

  return recipe?.title?.trim() ?? null;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const recipeId = getParam(resolvedSearchParams.recipeId);

  let title = "Recipes";

  if (recipeId) {
    const recipeTitle = await fetchRecipeTitle(recipeId, slug);
    if (recipeTitle) {
      title = recipeTitle;
    }
  }

  return {
    title,
    alternates: {
      canonical: recipeId ? `/g/${slug}/cook?recipeId=${recipeId}` : `/g/${slug}/cook`,
    },
  };
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

function formatSourceLabel(sourceName?: string | null, sourceUrl?: string | null) {
  if (sourceName?.trim()) return sourceName.trim();
  if (sourceUrl?.trim()) {
    try {
      const url = new URL(sourceUrl);
      return url.hostname.replace(/^www\./, "");
    } catch {
      return sourceUrl;
    }
  }
  return "Manually Added";
}

function buildSourceOptions(
  recipes: Array<{ sourceName: string | null; sourceUrl: string | null }>,
): SourceOption[] {
  const optionMap = new Map<string, string>();
  let hasManual = false;

  recipes.forEach(({ sourceName, sourceUrl }) => {
    if (!sourceName?.trim() && !sourceUrl?.trim()) {
      hasManual = true;
      return;
    }
    const label = formatSourceLabel(sourceName, sourceUrl);
    if (label === "Manually Added") {
      hasManual = true;
      return;
    }
    const valuePrefix = sourceName?.trim() ? "name:" : "url:";
    const value = `${valuePrefix}${encodeURIComponent(label)}`;
    optionMap.set(value, label);
  });

  const options = Array.from(optionMap.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));

  if (hasManual) {
    options.push({ label: "Manually Added", value: "manual" });
  }

  return [{ label: "All sources", value: "all" }, ...options];
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
      recipeTags: {
        orderBy: { tag: { name: "asc" } },
        select: {
          tag: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
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
    tags: recipe.recipeTags.map((recipeTag) => recipeTag.tag),
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
  const source = getParam(resolvedSearchParams.source) ?? "all";
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
      sourceName?: { equals: string };
      sourceUrl?: { equals?: string | null; contains?: string; mode?: "insensitive" } | null;
      OR?: Array<{ sourceUrl: { equals: string | null } | null }>;
      import?: { is: null };
    }>;
  } = {
    workspaceId: workspace.id,
  };

  const addAndClause = (clause: NonNullable<(typeof where)["AND"]>[number]) => {
    where.AND = [...(where.AND ?? []), clause];
  };

  if (q.trim()) {
    where.title = { contains: q.trim(), mode: "insensitive" };
  }

  if (minRating > 0) {
    where.rating = { gte: minRating };
  }

  if (manualOnly) {
    addAndClause({
      OR: [{ sourceUrl: { equals: null } }, { sourceUrl: { equals: "" } }],
    });
    addAndClause({ import: { is: null } });
  }

  if (source && source !== "all") {
    if (source === "manual") {
      addAndClause({
        OR: [{ sourceUrl: { equals: null } }, { sourceUrl: { equals: "" } }],
      });
      addAndClause({ import: { is: null } });
    } else if (source.startsWith("name:")) {
      const name = decodeURIComponent(source.slice(5));
      if (name) {
        addAndClause({ sourceName: { equals: name } });
      }
    } else if (source.startsWith("url:")) {
      const host = decodeURIComponent(source.slice(4));
      if (host) {
        addAndClause({ sourceUrl: { contains: host, mode: "insensitive" } });
      }
    }
  }

  const sourceRecipes = await prisma.recipe.findMany({
    where: { workspaceId: workspace.id },
    select: { sourceName: true, sourceUrl: true },
  });

  const sourceOptions = buildSourceOptions(sourceRecipes);

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
      recipeTags: {
        orderBy: { tag: { name: "asc" } },
        select: {
          tag: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  const listRecipes = recipes.map((recipe) => ({
    ...recipe,
    tags: recipe.recipeTags.map((recipeTag) => recipeTag.tag),
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
          source={source}
          sourceOptions={sourceOptions}
          sort={sort}
          dir={dir}
          selectedRecipe={selectedRecipe}
          selectedCookingRecipe={selectedCookingRecipe}
        />
      </main>
    </div>
  );
}
