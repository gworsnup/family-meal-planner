import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import ShortcutSetupClient from "../../_components/ShortcutSetupClient";

export default async function ShortcutSetupPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, user, headerList] = await Promise.all([params, getCurrentUser(), headers()]);
  if (!user?.workspace || user.workspace.slug !== slug) notFound();

  const tokens = await prisma.shortcutImportToken.findMany({
    where: { workspaceId: user.workspace.id, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, label: true, createdAt: true, lastUsedAt: true },
  });
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "app.familytable.me";
  const protocol = headerList.get("x-forwarded-proto") ?? "https";
  const endpoint = `${protocol}://${host}/api/shortcut/import`;

  return (
    <div className="space-y-5">
      <Link href={`/mobile/${slug}/import`} className="inline-flex text-sm font-semibold text-slate-500">‹ Import</Link>
      <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">iPhone setup</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Save Recipe Shortcut</h1><p className="mt-2 text-sm leading-6 text-slate-600">Send Instagram and TikTok links straight into the same FamilyTable importer from the iOS Share Sheet.</p></div>
      <ShortcutSetupClient slug={slug} endpoint={endpoint} tokens={tokens.map((token) => ({ ...token, createdAt: token.createdAt.toISOString(), lastUsedAt: token.lastUsedAt?.toISOString() ?? null }))} />
    </div>
  );
}
