import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MobileSmartListDetail from "../../../_components/MobileSmartListDetail";
import { getWorkspaceUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SMART_LIST_CATEGORIES } from "@/lib/smartListConfig";

export const metadata: Metadata = { title: "Smart List" };

export default async function MobileSmartListPage({
  params,
}: {
  params: Promise<{ slug: string; smartListId: string }>;
}) {
  const { slug, smartListId } = await params;
  const user = await getWorkspaceUser(slug);
  if (!user) notFound();

  const smartList = await prisma.shoppingListSmart.findFirst({
    where: { id: smartListId, workspaceId: user.workspace.id },
    include: {
      week: { select: { weekStart: true } },
      items: { orderBy: { sortKey: "asc" } },
    },
  });
  if (!smartList) notFound();

  const categoryMap = new Map<string, typeof smartList.items>();
  smartList.items.forEach((item) => {
    const items = categoryMap.get(item.category) ?? [];
    items.push(item);
    categoryMap.set(item.category, items);
  });
  const categoryNames = [
    ...SMART_LIST_CATEGORIES.filter((name) => categoryMap.has(name)),
    ...Array.from(categoryMap.keys()).filter((name) => !SMART_LIST_CATEGORIES.includes(name)),
  ];
  const categories = categoryNames.map((name) => ({
    name,
    items: (categoryMap.get(name) ?? []).map((item) => ({ id: item.id, displayText: item.displayText })),
  }));
  const weekStart = smartList.week.weekStart.toISOString().slice(0, 10);
  const weekLabel = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(smartList.week.weekStart);

  return (
    <div className="space-y-5">
      <Link href={`/mobile/${slug}/lists`} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500">‹ Lists</Link>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Smart List</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Week of {weekLabel}</h1>
        <p className="mt-2 text-sm text-slate-500">Generated {smartList.createdAt.toLocaleDateString("en-GB")}. Ticked items are kept on this phone.</p>
      </div>
      <MobileSmartListDetail smartListId={smartList.id} weekStart={weekStart} categories={categories} />
    </div>
  );
}
