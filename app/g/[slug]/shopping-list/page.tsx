import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import WorkspaceHeader from "../_components/WorkspaceHeader";
import ShopClient from "./ShopClient";
import { formatDateISO, getTodayUTC, parseDateISO, startOfWeek } from "@/lib/planDates";
import type { WeekList } from "@/lib/ingredientParsing";
import type { SmartListData } from "@/lib/smartListTypes";
import { SMART_LIST_CATEGORIES } from "@/lib/smartListConfig";

function getOrdinalSuffix(value: number) {
  const remainder = value % 100;
  if (remainder >= 11 && remainder <= 13) return "th";
  switch (value % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function formatWeekTitle(date: Date) {
  const day = date.getUTCDate();
  const month = new Intl.DateTimeFormat("en-GB", {
    month: "short",
    timeZone: "UTC",
  }).format(date);
  return `Shopping List w/c ${day}${getOrdinalSuffix(day)} ${month}`;
}

export default async function ShoppingListPage({
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

  const user = await getCurrentUser();
  const isAdmin = user?.isAdmin ?? false;

  const workspaces = isAdmin
    ? await prisma.workspace.findMany({
        select: { name: true, slug: true },
        orderBy: { name: "asc" },
      })
    : [];

  const startOfThisWeek = startOfWeek(getTodayUTC());

  const planItems = await prisma.mealPlanItem.findMany({
    where: {
      workspaceId: workspace.id,
      date: {
        gte: startOfThisWeek,
      },
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    include: {
      recipe: {
        select: {
          id: true,
          title: true,
          photoUrl: true,
          ingredientLines: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              ingredient: true,
              position: true,
            },
          },
        },
      },
    },
  });

  const weeks = new Map<string, WeekList>();

  planItems.forEach((item) => {
    const weekStartDate = startOfWeek(item.date);
    const weekStartISO = formatDateISO(weekStartDate);
    const existing = weeks.get(weekStartISO);
    const recipeEntry = {
      id: item.recipe.id,
      title: item.recipe.title,
      photoUrl: item.recipe.photoUrl,
      ingredientLines: item.recipe.ingredientLines,
    };
    if (existing) {
      existing.recipes.push(recipeEntry);
      return;
    }

    weeks.set(weekStartISO, {
      weekStart: weekStartISO,
      title: formatWeekTitle(weekStartDate),
      recipes: [recipeEntry],
    });
  });

  const weekLists = Array.from(weeks.values());

  const weekRows = await Promise.all(
    weekLists.map(async (week) => {
      const weekStartDate = parseDateISO(week.weekStart);
      if (!weekStartDate) return null;
      const existing = await prisma.shoppingListWeek.findUnique({
        where: {
          workspaceId_weekStart: {
            workspaceId: workspace.id,
            weekStart: weekStartDate,
          },
        },
      });
      if (existing) return existing;
      return prisma.shoppingListWeek.create({
        data: {
          workspaceId: workspace.id,
          weekStart: weekStartDate,
          version: 1,
        },
      });
    }),
  );

  const validWeekRows = weekRows.filter(
    (row): row is NonNullable<(typeof weekRows)[number]> => Boolean(row),
  );

  const weekRowMap = new Map(
    validWeekRows.map((row) => [formatDateISO(row.weekStart), row]),
  );

  const smartLists = validWeekRows.length
    ? await prisma.shoppingListSmart.findMany({
        where: {
          workspaceId: workspace.id,
          weekId: {
            in: validWeekRows.map((row) => row.id),
          },
        },
        orderBy: [{ version: "desc" }, { createdAt: "desc" }],
        include: {
          items: {
            include: { provenance: true },
            orderBy: { sortKey: "asc" },
          },
        },
      })
    : [];

  const smartListMap = new Map<string, SmartListData>();
  smartLists.forEach((record) => {
    if (smartListMap.has(record.weekId)) {
      return;
    }
    const categoryMap = new Map<string, SmartListData["categories"][number]["items"]>();
    record.items.forEach((item) => {
      const entry = {
        id: item.id,
        category: item.category,
        displayText: item.displayText,
        quantityValue: item.quantityValue ? Number(item.quantityValue) : null,
        quantityUnit: item.quantityUnit,
        isEstimated: item.isEstimated,
        isMerged: item.isMerged,
        sortKey: item.sortKey,
        provenance: item.provenance.map((prov) => ({
          id: prov.id,
          sourceText: prov.sourceText,
          sourceRecipeId: prov.sourceRecipeId,
          sourceCount: prov.sourceCount,
          notes: prov.notes,
        })),
      };
      const existing = categoryMap.get(item.category) ?? [];
      existing.push(entry);
      categoryMap.set(item.category, existing);
    });

    const orderedCategories = SMART_LIST_CATEGORIES.filter((name) => categoryMap.has(name))
      .map((name) => ({
        name,
        items: (categoryMap.get(name) ?? []).sort((a, b) => a.sortKey - b.sortKey),
      }))
      .concat(
        Array.from(categoryMap.entries())
          .filter(([name]) => !SMART_LIST_CATEGORIES.includes(name))
          .map(([name, items]) => ({
            name,
            items: items.sort((a, b) => a.sortKey - b.sortKey),
          })),
      );

    smartListMap.set(record.weekId, {
      id: record.id,
      weekId: record.weekId,
      version: record.version,
      model: record.model,
      categories: orderedCategories,
      createdAt: record.createdAt.toISOString(),
    });
  });

  const weekListsWithMeta: WeekList[] = weekLists.map((week) => {
    const weekRow = weekRowMap.get(week.weekStart);
    if (!weekRow) return week;
    return {
      ...week,
      weekId: weekRow.id,
      version: weekRow.version,
      smartList: smartListMap.get(weekRow.id) ?? null,
    };
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <WorkspaceHeader
        slug={slug}
        workspaceName={workspace.name}
        workspaces={workspaces}
        isAdmin={isAdmin}
        current="shopping"
      />
      <ShopClient
        workspaceSlug={slug}
        workspaceName={workspace.name}
        weekLists={weekListsWithMeta}
      />
    </div>
  );
}
