import Link from "next/link";

type RecipeCardProps = {
  slug: string;
  recipe: {
    id: string;
    title: string;
    photoUrl: string | null;
    totalTimeMinutes: number | null;
    cookTimeMinutes: number | null;
    sourceName: string | null;
  };
};

export default function RecipeCard({ slug, recipe }: RecipeCardProps) {
  const minutes = recipe.totalTimeMinutes ?? recipe.cookTimeMinutes;
  return (
    <Link href={`/mobile/${slug}/recipes/${recipe.id}`} className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm active:scale-[0.99]">
      {recipe.photoUrl ? (
        // Recipe images can come from arbitrary importer domains, so Next Image cannot safely enumerate hosts.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={recipe.photoUrl} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-24 w-24 flex-none rounded-2xl object-cover" />
      ) : (
        <div className="flex h-24 w-24 flex-none items-center justify-center rounded-2xl bg-slate-100 text-3xl">🍽️</div>
      )}
      <div className="min-w-0 flex-1 py-1">
        <h2 className="line-clamp-2 text-base font-bold leading-5 text-slate-900">{recipe.title}</h2>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
          {minutes ? <span className="rounded-full bg-slate-100 px-2.5 py-1">{minutes} min</span> : null}
          {recipe.sourceName ? <span className="max-w-32 truncate rounded-full bg-slate-100 px-2.5 py-1">{recipe.sourceName}</span> : null}
        </div>
      </div>
      <span className="self-center text-xl text-slate-300" aria-hidden="true">›</span>
    </Link>
  );
}
