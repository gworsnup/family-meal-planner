import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWorkspaceUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildShoppingView, type WeekList } from "@/lib/ingredientParsing";
import { addDays, formatDateISO, getTodayUTC, parseDateISO, startOfWeek } from "@/lib/planDates";
import { SMART_LIST_CATEGORIES } from "@/lib/smartListConfig";
import type { SmartListData } from "@/lib/smartListTypes";
import MobileSmartShoppingList from "../../_components/MobileSmartShoppingList";

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

  const weekRow = await prisma.shoppingListWeek.upsert({
    where: { workspaceId_weekStart: { workspaceId: user.workspace.id, weekStart } },
    update: {},
    create: { workspaceId: user.workspace.id, weekStart, version: 1 },
  });
  const smartListRecord = await prisma.shoppingListSmart.findFirst({
    where: { workspaceId: user.workspace.id, weekId: weekRow.id },
    orderBy: [{ version: "desc" }, { createdAt: "desc" }],
    include: { items: { include: { provenance: true }, orderBy: { sortKey: "asc" } } },
  });

  let smartList: SmartListData | null = null;
  if (smartListRecord) {
    const categoryMap = new Map<string, SmartListData["categories"][number]["items"]>();
    smartListRecord.items.forEach((item) => {
      const entries = categoryMap.get(item.category) ?? [];
      entries.push({
        id: item.id,
        category: item.category,
        displayText: item.displayText,
        quantityValue: item.quantityValue ? Number(item.quantityValue) : null,
        quantityUnit: item.quantityUnit,
        isEstimated: item.isEstimated,
        isMerged: item.isMerged,
        sortKey: item.sortKey,
        provenance: item.provenance.map((source) => ({
          id: source.id,
          sourceText: source.sourceText,
          sourceRecipeId: source.sourceRecipeId,
          sourceCount: source.sourceCount,
          notes: source.notes,
        })),
      });
      categoryMap.set(item.category, entries);
    });
    const categoryNames = [
      ...SMART_LIST_CATEGORIES.filter((name) => categoryMap.has(name)),
      ...Array.from(categoryMap.keys()).filter((name) => !SMART_LIST_CATEGORIES.includes(name)),
    ];
    smartList = {
      id: smartListRecord.id,
      weekId: smartListRecord.weekId,
      version: smartListRecord.version,
      model: smartListRecord.model,
      createdAt: smartListRecord.createdAt.toISOString(),
      categories: categoryNames.map((name) => ({ name, items: categoryMap.get(name) ?? [] })),
    };
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Shopping</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Shopping list</h1>
        <p className="mt-2 text-sm text-slate-500">Ticked items are kept on this phone.</p>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-2">
        <Link aria-label="Previous week" href={`?week=${formatDateISO(addDays(weekStart, -7))}`} className="flex h-10 w-10 items-center justify-center rounded-xl text-2xl">‹</Link>
        <div className="text-center"><p className="text-sm font-semibold">Week of {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "UTC" }).format(weekStart)}</p><Link href="?" className="text-xs font-semibold text-slate-500">Current week</Link></div>
        <Link aria-label="Next week" href={`?week=${formatDateISO(addDays(weekStart, 7))}`} className="flex h-10 w-10 items-center justify-center rounded-xl text-2xl">›</Link>
      </div>

      {categories.length ? <MobileSmartShoppingList key={`${weekRow.id}:${smartList?.id ?? "aggregated"}`} workspaceId={user.workspace.id} weekId={weekRow.id} weekVersion={weekRow.version} weekStart={weekStartISO} categories={categories} smartList={smartList} /> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><div className="text-4xl">🛒</div><h2 className="mt-3 text-lg font-semibold">No ingredients yet</h2><p className="mt-2 text-sm text-slate-500">Plan recipes for this week to build the list.</p></div>}

      <Link href={`/g/${slug}/shopping-list`} className="block text-center text-sm font-semibold text-slate-500 underline">Open full shopping list</Link>
    </div>
  );
}
