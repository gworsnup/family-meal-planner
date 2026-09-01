import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWorkspaceUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildShoppingView, type WeekList } from "@/lib/ingredientParsing";
import { addDays, formatDateISO, getTodayUTC, parseDateISO, startOfWeek } from "@/lib/planDates";
import MobileShoppingChecklist from "../../_components/MobileShoppingChecklist";

export const metadata: Metadata = { title: "Shopping list" };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MobileShoppingListPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const user = await getWorkspaceUser(slug);
  if (!user) notFound();

  const selected = parseDateISO(first(query.week) ?? "");
  const weekStart = startOfWeek(selected ?? getTodayUTC());
  const weekStartISO = formatDateISO(weekStart);
  const planItems = await prisma.mealPlanItem.findMany({
    where: { workspaceId: user.workspace.id, type: "RECIPE", date: { gte: weekStart, lt: addDays(weekStart, 7) } },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    include: {
      recipe: {
        select: {
          id: true,
          title: true,
          sourceUrl: true,
          photoUrl: true,
          import: { select: { sourceUrl: true } },
          ingredientLines: { orderBy: { position: "asc" }, select: { id: true, ingredient: true, position: true } },
        },
      },
    },
  });

  const week: WeekList = {
    weekStart: weekStartISO,
    title: "",
    recipes: planItems.filter((item) => item.recipe).map((item) => ({
      id: item.recipe!.id,
      dateISO: formatDateISO(item.date),
      title: item.recipe!.title,
      sourceUrl: item.recipe!.sourceUrl,
      importUrl: item.recipe!.import?.sourceUrl ?? null,
      photoUrl: item.recipe!.photoUrl,
      ingredientLines: item.recipe!.ingredientLines,
    })),
  };
  const categories = buildShoppingView(week, { aggregate: true, metric: false })
    .filter((category) => category.items.length)
    .map((category) => ({ key: category.key, label: category.label, items: category.items.map((item) => ({ id: item.id, display: item.display })) }));

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">View only</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Shopping list</h1>
        <p className="mt-2 text-sm text-slate-500">Ticked items are kept on this phone.</p>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-2">
        <Link aria-label="Previous week" href={`?week=${formatDateISO(addDays(weekStart, -7))}`} className="flex h-10 w-10 items-center justify-center rounded-xl text-2xl">‹</Link>
        <div className="text-center"><p className="text-sm font-bold">Week of {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "UTC" }).format(weekStart)}</p><Link href="?" className="text-xs font-semibold text-emerald-700">Current week</Link></div>
        <Link aria-label="Next week" href={`?week=${formatDateISO(addDays(weekStart, 7))}`} className="flex h-10 w-10 items-center justify-center rounded-xl text-2xl">›</Link>
      </div>

      {categories.length ? <MobileShoppingChecklist weekStart={weekStartISO} categories={categories} /> : <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center"><div className="text-4xl">🛒</div><h2 className="mt-3 text-lg font-bold">No ingredients yet</h2><p className="mt-2 text-sm text-slate-500">Plan recipes for this week to build the list.</p></div>}

      <Link href={`/g/${slug}/shopping-list`} className="block text-center text-sm font-semibold text-slate-500 underline">Open full shopping list</Link>
    </div>
  );
}
