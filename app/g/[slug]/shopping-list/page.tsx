import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import WorkspaceHeader from "../_components/WorkspaceHeader";
import ShopClient from "./ShopClient";
import { formatDateISO, getTodayUTC, startOfWeek } from "@/lib/planDates";
import type { WeekList } from "@/lib/ingredientParsing";

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

  const workspaces = await prisma.workspace.findMany({
    select: { name: true, slug: true },
    orderBy: { name: "asc" },
  });

  const cookieStore = await cookies();
  const authed = cookieStore.get(`wsp_${slug}`)?.value === "1";

  if (!authed) {
    return (
      <div className="min-h-screen bg-white">
        <WorkspaceHeader
          slug={slug}
          workspaceName={workspace.name}
          workspaces={workspaces}
          current="shopping"
        />
        <div className="mx-auto max-w-md px-6 py-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
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
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus-visible:ring-slate-900/10"
              />
              <button className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30">
                Unlock
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-slate-50">
      <WorkspaceHeader
        slug={slug}
        workspaceName={workspace.name}
        workspaces={workspaces}
        current="shopping"
      />
      <ShopClient workspaceName={workspace.name} weekLists={weekLists} />
    </div>
  );
}
