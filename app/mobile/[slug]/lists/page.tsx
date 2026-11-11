import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWorkspaceUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Lists" };

export default async function MobileListsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getWorkspaceUser(slug);
  if (!user) notFound();

  const records = await prisma.shoppingListSmart.findMany({
    where: { workspaceId: user.workspace.id },
    orderBy: [{ createdAt: "desc" }],
    include: {
      week: { select: { weekStart: true, version: true } },
      _count: { select: { items: true } },
    },
  });

  const latestByWeek = new Map<string, (typeof records)[number]>();
  records.forEach((record) => {
    if (!latestByWeek.has(record.weekId)) latestByWeek.set(record.weekId, record);
  });
  const lists = Array.from(latestByWeek.values()).sort(
    (a, b) => b.week.weekStart.getTime() - a.week.weekStart.getTime(),
  );
  const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Shopping</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Lists</h1>
          <p className="mt-1 text-sm text-slate-500">Browse your generated Smart Lists.</p>
        </div>
        <Link href={`/mobile/${slug}/shopping-list`} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
          Open Shop
        </Link>
      </div>

      {lists.length ? (
        <div className="space-y-3">
          {lists.map((list) => {
            const outdated = list.version < list.week.version;
            return (
              <Link
                key={list.id}
                href={`/mobile/${slug}/lists/${list.id}`}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition active:scale-[0.99]"
              >
                <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-slate-100 text-2xl" aria-hidden="true">🛒</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold text-slate-900">Week of {dateFormatter.format(list.week.weekStart)}</span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {list._count.items} item{list._count.items === 1 ? "" : "s"} · Generated {list.createdAt.toLocaleDateString("en-GB")}
                  </span>
                  <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${outdated ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {outdated ? "Out of date" : "Smart List"}
                  </span>
                </span>
                <span className="text-xl text-slate-300" aria-hidden="true">›</span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <div className="text-4xl">🛒</div>
          <h2 className="mt-3 text-lg font-semibold">No Smart Lists yet</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Generate one from Shop and it will appear here for browsing and sharing.</p>
          <Link href={`/mobile/${slug}/shopping-list`} className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
            Go to Shop
          </Link>
        </div>
      )}
    </div>
  );
}
