import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import RecipeCard from "../../_components/RecipeCard";

export const metadata: Metadata = { title: "Recipes" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MobileRecipesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, query, user] = await Promise.all([params, searchParams, getCurrentUser()]);
  if (!user?.workspace || user.workspace.slug !== slug) notFound();
  const q = first(query.q)?.trim() ?? "";

  const recipes = await prisma.recipe.findMany({
    where: {
      workspaceId: user.workspace.id,
      ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      photoUrl: true,
      totalTimeMinutes: true,
      cookTimeMinutes: true,
      sourceName: true,
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Your library</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Recipes</h1>
          <p className="mt-1 text-sm text-slate-500">{recipes.length}{q ? " matching" : " saved"}</p>
        </div>
        <Link href={`/mobile/${slug}/import`} className="rounded-full bg-slate-900 px-4 py-2.5 text-sm font-bold text-white">+ Import</Link>
      </div>

      <form className="relative">
        <input type="search" name="q" defaultValue={q} placeholder="Search recipes…" className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-base outline-none focus:border-slate-400" />
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
      </form>

      {recipes.length ? (
        <div className="space-y-3">
          {recipes.map((recipe) => <RecipeCard key={recipe.id} slug={slug} recipe={recipe} />)}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <div className="text-4xl">🥘</div>
          <h2 className="mt-3 text-lg font-bold">{q ? "No matching recipes" : "Your library is empty"}</h2>
          <p className="mt-2 text-sm text-slate-500">{q ? "Try a different search." : "Import your first recipe from a link."}</p>
        </div>
      )}
    </div>
  );
}
