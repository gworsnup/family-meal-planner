import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import WorkspaceHeader from "../../_components/WorkspaceHeader";

function parseOptionalInt(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseOptionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function deriveSourceName(sourceUrl: string) {
  try {
    const url = new URL(sourceUrl);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export default async function NewRecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

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
              <button className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
                Unlock
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  async function createRecipe(formData: FormData) {
    "use server";

    const cookieStoreForAction = await cookies();
    const authedForAction = cookieStoreForAction.get(`wsp_${slug}`)?.value === "1";
    if (!authedForAction) {
      return redirect(`/g/${slug}`);
    }

    const workspaceForAction = await prisma.workspace.findUnique({ where: { slug } });
    if (!workspaceForAction) {
      return redirect("/g/" + slug);
    }

    const title = formData.get("title")?.toString().trim();
    if (!title) {
      throw new Error("Title is required");
    }

    const prepTimeMinutes = parseOptionalInt(formData.get("prepTimeMinutes"));
    const cookTimeMinutes = parseOptionalInt(formData.get("cookTimeMinutes"));
    const totalTimeMinutesInput = parseOptionalInt(formData.get("totalTimeMinutes"));
    const ratingInput = parseOptionalInt(formData.get("rating"));
    const rating =
      ratingInput !== null && (ratingInput < 0 || ratingInput > 5)
        ? null
        : ratingInput;
    const totalTimeMinutes =
      totalTimeMinutesInput ??
      (prepTimeMinutes !== null && cookTimeMinutes !== null
        ? prepTimeMinutes + cookTimeMinutes
        : null);
    const sourceUrl = parseOptionalString(formData.get("sourceUrl"));
    const sourceName =
      parseOptionalString(formData.get("sourceName")) ??
      (sourceUrl ? deriveSourceName(sourceUrl) : null);

    await prisma.recipe.create({
      data: {
        workspaceId: workspaceForAction.id,
        title,
        sourceName,
        sourceUrl,
        photoUrl: parseOptionalString(formData.get("photoUrl")),
        prepTimeMinutes,
        cookTimeMinutes,
        totalTimeMinutes,
        servings: parseOptionalString(formData.get("servings")),
        yields: parseOptionalString(formData.get("yields")),
        rating,
        directions: parseOptionalString(formData.get("directions")),
        ingredientLines: {
          create: (formData.get("ingredients")?.toString() || "")
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((ingredient, index) => ({
              position: index + 1,
              ingredient,
            })),
        },
      },
    });

    redirect(`/g/${slug}/cook`);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <WorkspaceHeader slug={slug} workspaceName={workspace.name} current="recipes" />
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Add recipe
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Save a recipe to {workspace.name}.
              </p>
            </div>
            <Link
              href={`/g/${slug}/cook`}
              className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              ← Back to Recipes
            </Link>
          </div>

          <form action={createRecipe} className="grid gap-5">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-semibold text-slate-800">
                Title *
              </label>
              <input
                id="title"
                name="title"
                required
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder="Recipe title"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="sourceUrl" className="text-sm font-semibold text-slate-800">
                Source URL
              </label>
              <input
                id="sourceUrl"
                name="sourceUrl"
                type="url"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder="https://example.com/recipe"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="photoUrl" className="text-sm font-semibold text-slate-800">
                Photo URL
              </label>
              <input
                id="photoUrl"
                name="photoUrl"
                type="url"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder="https://example.com/photo.jpg"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <label
                  htmlFor="prepTimeMinutes"
                  className="text-sm font-semibold text-slate-800"
                >
                  Prep time (minutes)
                </label>
                <input
                  id="prepTimeMinutes"
                  name="prepTimeMinutes"
                  type="number"
                  min="0"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="15"
                />
              </div>
              <div className="grid gap-2">
                <label
                  htmlFor="cookTimeMinutes"
                  className="text-sm font-semibold text-slate-800"
                >
                  Cook time (minutes)
                </label>
                <input
                  id="cookTimeMinutes"
                  name="cookTimeMinutes"
                  type="number"
                  min="0"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="30"
                />
              </div>
              <div className="grid gap-2">
                <label
                  htmlFor="totalTimeMinutes"
                  className="text-sm font-semibold text-slate-800"
                >
                  Total time (minutes)
                </label>
                <input
                  id="totalTimeMinutes"
                  name="totalTimeMinutes"
                  type="number"
                  min="0"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="45"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <label htmlFor="servings" className="text-sm font-semibold text-slate-800">
                  Servings
                </label>
                <input
                  id="servings"
                  name="servings"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="4"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="yields" className="text-sm font-semibold text-slate-800">
                  Yields
                </label>
                <input
                  id="yields"
                  name="yields"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="1 loaf"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="rating" className="text-sm font-semibold text-slate-800">
                  Rating (0-5)
                </label>
                <input
                  id="rating"
                  name="rating"
                  type="number"
                  min="0"
                  max="5"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="5"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label
                htmlFor="ingredients"
                className="text-sm font-semibold text-slate-800"
              >
                Ingredients (one per line)
              </label>
              <textarea
                id="ingredients"
                name="ingredients"
                rows={6}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder={"2 cups flour\n1 tsp salt\n1 cup water"}
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="directions" className="text-sm font-semibold text-slate-800">
                Directions
              </label>
              <textarea
                id="directions"
                name="directions"
                rows={6}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder="Write out the steps"
              />
            </div>

            <button
              type="submit"
              className="w-fit rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              Save recipe
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
