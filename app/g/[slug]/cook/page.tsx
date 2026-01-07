import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
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
    return <div style={{ padding: 24 }}>Workspace not found.</div>;
  }

  const cookieStore = await cookies();
  const authed = cookieStore.get(`wsp_${slug}`)?.value === "1";

  if (!authed) {
    return (
      <div style={{ padding: 24, maxWidth: 420 }}>
        <h1>{workspace.name}</h1>
        <p>Enter passcode to continue.</p>

        <form action={`/api/workspace/${slug}/login`} method="post">
          <input
            name="passcode"
            type="password"
            placeholder="Passcode"
            autoFocus
            style={{ padding: 12, width: "100%", marginTop: 12 }}
          />
          <button style={{ marginTop: 12, padding: 12, width: "100%" }}>
            Unlock
          </button>
        </form>
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
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>{workspace.name} · Cook</h1>
          <p style={{ marginTop: 4, color: "#555" }}>
            Recipes in this workspace.
          </p>
        </div>
        <Link
          href={`/g/${slug}/cook/new`}
          style={{
            padding: "10px 14px",
            background: "#0f766e",
            color: "white",
            borderRadius: 6,
            textDecoration: "none",
          }}
        >
          Add recipe
        </Link>
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
    </div>
  );
}
