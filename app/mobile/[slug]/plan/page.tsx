import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addDays, formatDateISO, getTodayUTC, parseDateISO, startOfWeek } from "@/lib/planDates";
import { buildWeekShareMessage } from "@/lib/planShare";
import MobileWeekShareButton from "../../_components/MobileWeekShareButton";

export const metadata: Metadata = { title: "This week" };

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatWeekRange(start: Date) {
  const end = addDays(start, 6);
  const startLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(start);
  const endLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(end);
  return `${startLabel} – ${endLabel}`;
}

export default async function MobilePlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ slug }, query, user] = await Promise.all([params, searchParams, getCurrentUser()]);
  if (!user?.workspace || user.workspace.slug !== slug) notFound();

  const requested = parseDateISO(first(query.week) ?? "");
  const weekStart = startOfWeek(requested ?? getTodayUTC());
  const weekEnd = addDays(weekStart, 6);
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  const items = await prisma.mealPlanItem.findMany({
    where: { workspaceId: user.workspace.id, date: { gte: weekStart, lt: addDays(weekEnd, 1) } },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    include: {
      recipe: {
        select: { id: true, title: true, photoUrl: true, sourceUrl: true, import: { select: { sourceUrl: true } } },
      },
    },
  });

  const itemsByDay = new Map<string, typeof items>();
  for (const item of items) {
    const key = formatDateISO(item.date);
    itemsByDay.set(key, [...(itemsByDay.get(key) ?? []), item]);
  }

  const shareLines = days.flatMap((day, index) => {
    const dayItems = itemsByDay.get(formatDateISO(day)) ?? [];
    return dayItems.map((item) => {
      const title = item.type === "TAKEAWAY" ? "Takeaway Night 🍕" : item.recipe?.title ?? item.title ?? "Meal";
      const source = item.recipe?.sourceUrl ?? item.recipe?.import?.sourceUrl ?? null;
      return `${DAY_LABELS[index].slice(0, 3)}: ${title}${source ? `\nSource: ${source}` : ""}`;
    });
  });
  const shareMessage = buildWeekShareMessage(shareLines);
  const todayISO = formatDateISO(getTodayUTC());

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Meal plan</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">This week</h1>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-2">
        <Link aria-label="Previous week" href={`?week=${formatDateISO(addDays(weekStart, -7))}`} className="flex h-10 w-10 items-center justify-center rounded-xl text-2xl text-slate-600">‹</Link>
        <div className="text-center"><p className="text-sm font-bold">{formatWeekRange(weekStart)}</p><Link href="?" className="text-xs font-semibold text-emerald-700">Jump to current week</Link></div>
        <Link aria-label="Next week" href={`?week=${formatDateISO(addDays(weekStart, 7))}`} className="flex h-10 w-10 items-center justify-center rounded-xl text-2xl text-slate-600">›</Link>
      </div>

      <div className="space-y-3">
        {days.map((day, index) => {
          const dateISO = formatDateISO(day);
          const dayItems = itemsByDay.get(dateISO) ?? [];
          const isToday = dateISO === todayISO;
          return (
            <section key={dateISO} className={`overflow-hidden rounded-3xl border bg-white ${isToday ? "border-emerald-400 shadow-sm" : "border-slate-200"}`}>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2"><h2 className="font-bold">{DAY_LABELS[index]}</h2>{isToday ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-800">Today</span> : null}</div>
                <time className="text-xs font-semibold text-slate-400">{new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(day)}</time>
              </div>

              {dayItems.length ? <div className="border-t border-slate-100">{dayItems.map((item) => {
                if (item.type === "TAKEAWAY" || !item.recipe) return <div key={item.id} className="flex items-center gap-3 px-4 py-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl">🥡</div><div><p className="font-bold">{item.title ?? "Takeaway night"}</p><p className="text-xs text-slate-500">No cooking tonight</p></div></div>;
                return <Link key={item.id} href={`/mobile/${slug}/recipes/${item.recipe.id}/cook`} className="flex items-center gap-3 px-4 py-3 active:bg-slate-50">{item.recipe.photoUrl ? <>
                  {/* Imported recipe images can be hosted on arbitrary source domains. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.recipe.photoUrl} alt="" referrerPolicy="no-referrer" className="h-16 w-16 flex-none rounded-2xl object-cover" />
                </> : <div className="flex h-16 w-16 flex-none items-center justify-center rounded-2xl bg-slate-100 text-2xl">🍲</div>}<div className="min-w-0 flex-1"><p className="font-bold leading-5">{item.recipe.title}</p><p className="mt-1 text-xs font-semibold text-emerald-700">Open cooking view</p></div><span className="text-2xl text-slate-300">›</span></Link>;
              })}</div> : <p className="border-t border-slate-100 px-4 py-4 text-sm text-slate-400">Nothing planned</p>}
            </section>
          );
        })}
      </div>

      <MobileWeekShareButton message={shareMessage} />
      {!shareMessage ? <p className="text-center text-xs text-slate-400">Add meals in the desktop planner before sharing this week.</p> : null}
    </div>
  );
}
