import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function MobileHome() {
  const user = await getCurrentUser();

  if (!user) redirect("/?next=/mobile");
  if (user.isAdmin) {
    const workspaces = await prisma.workspace.findMany({
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    });
    return (
      <main className="min-h-screen bg-[#fcfcfc] px-4 py-10 text-slate-900">
        <div className="mx-auto max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Administrator</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">Choose a workspace</h1>
          <p className="mt-2 text-sm text-slate-600">Select the household you want to open in the mobile app.</p>
          <div className="mt-6 space-y-3">
            {workspaces.map((workspace) => (
              <a key={workspace.slug} href={`/mobile/${workspace.slug}/plan`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 font-bold shadow-sm">
                {workspace.name}<span className="text-xl text-slate-300">›</span>
              </a>
            ))}
          </div>
        </div>
      </main>
    );
  }
  if (!user.workspace) {
    redirect(user.hasCreatedWorkspace ? "/onboarding/locked" : "/onboarding/household");
  }

  redirect(`/mobile/${user.workspace.slug}/plan`);
}
