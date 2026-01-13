import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SMART_LIST_CATEGORIES } from "@/lib/smartListConfig";
import WorkspaceHeader from "../../_components/WorkspaceHeader";

export default async function SmartListDetailPage({
  params,
}: {
  params: Promise<{ slug: string; smartListId: string }>;
}) {
  const { slug, smartListId } = await params;

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

  const smartList = await prisma.shoppingListSmart.findFirst({
    where: { id: smartListId, workspaceId: workspace.id },
    include: {
      items: {
        include: { provenance: true },
        orderBy: { sortKey: "asc" },
      },
    },
  });

  if (!smartList) {
    return (
      <div className="min-h-screen bg-[#fcfcfc]">
        <WorkspaceHeader
          slug={slug}
          workspaceName={workspace.name}
          workspaces={workspaces}
          isAdmin={isAdmin}
          current="shopping"
        />
        <div className="mx-auto max-w-4xl px-6 py-12 text-slate-600">
          Smart list not found.
        </div>
      </div>
    );
  }

  const categoryMap = new Map<string, typeof smartList.items>();
  smartList.items.forEach((item) => {
    const existing = categoryMap.get(item.category) ?? [];
    existing.push(item);
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

  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      <WorkspaceHeader
        slug={slug}
        workspaceName={workspace.name}
        workspaces={workspaces}
        isAdmin={isAdmin}
        current="shopping"
      />
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Smart List</h1>
            <p className="text-sm text-slate-500">
              Generated on {smartList.createdAt.toLocaleDateString("en-GB")}.
            </p>
          </div>
          <Link
            href={`/g/${slug}/shopping-list`}
            className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
          >
            Back to Shopping List
          </Link>
        </div>

        <div className="mt-8 space-y-8">
          {orderedCategories.map((category) => (
            <section key={category.name} className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-900">{category.name}</h2>
              <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {category.items.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  >
                    <p className="font-medium text-slate-800">{item.displayText}</p>
                    {item.provenance.length > 0 ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Derived from {item.provenance.length} item
                        {item.provenance.length === 1 ? "" : "s"}.
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
