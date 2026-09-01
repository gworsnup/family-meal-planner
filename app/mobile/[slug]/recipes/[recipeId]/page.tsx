import Link from "next/link";
import { notFound } from "next/navigation";
import { getWorkspaceUser } from "@/lib/auth";
import { fetchRecipeDetailWithTiming } from "@/lib/recipeDetail";

export default async function MobileRecipePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; recipeId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug, recipeId }, query] = await Promise.all([params, searchParams]);
  const user = await getWorkspaceUser(slug);
  if (!user) notFound();
  const recipe = await fetchRecipeDetailWithTiming(recipeId, user.workspace.id);
  if (!recipe) notFound();
  const saved = query.saved === "1";

  return (
    <article className="space-y-5">
      <Link href={`/mobile/${slug}/recipes`} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500">‹ Recipes</Link>

      {saved ? <p className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">Recipe saved to your library.</p> : null}

      {recipe.photoUrl ? (
        // Imported recipe images can be hosted on arbitrary source domains.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={recipe.photoUrl} alt="" referrerPolicy="no-referrer" className="h-64 w-full rounded-2xl object-cover" />
      ) : null}

      <div>
        <h1 className="text-2xl font-semibold leading-tight text-slate-900">{recipe.title}</h1>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
          {recipe.totalTimeMinutes ? <span className="rounded-full bg-white px-3 py-1.5">{recipe.totalTimeMinutes} min</span> : null}
          {recipe.servings ? <span className="rounded-full bg-white px-3 py-1.5">Serves {recipe.servings}</span> : null}
          {recipe.sourceName ? <span className="rounded-full bg-white px-3 py-1.5">{recipe.sourceName}</span> : null}
        </div>
      </div>

      <Link href={`/mobile/${slug}/recipes/${recipe.id}/cook`} className="block rounded-lg bg-slate-900 px-5 py-3 text-center text-sm font-semibold text-white">Start cooking</Link>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold">Ingredients</h2>
        {recipe.ingredientLines.length ? (
          <ul className="mt-4 space-y-3">
            {recipe.ingredientLines.slice().sort((a, b) => a.position - b.position).map((line) => (
              <li key={line.id} className="flex gap-3 text-base leading-6 text-slate-700"><span className="text-slate-400">●</span><span>{line.ingredient}</span></li>
            ))}
          </ul>
        ) : <p className="mt-3 text-sm text-slate-500">No ingredients added.</p>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold">Instructions</h2>
        <p className="mt-4 whitespace-pre-line text-base leading-7 text-slate-700">{recipe.directions || "No instructions added."}</p>
      </section>

      {recipe.sourceUrl ? <a href={recipe.sourceUrl} target="_blank" rel="noreferrer" className="block truncate text-center text-sm font-semibold text-slate-500 underline">View original recipe</a> : null}
    </article>
  );
}
