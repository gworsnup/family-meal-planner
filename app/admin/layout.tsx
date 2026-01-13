import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import LogoutButton from "@/app/_components/LogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/?next=/admin");
  }

  if (!user.isAdmin) {
    if (user.workspace) {
      redirect(`/g/${user.workspace.slug}/`);
    }
    redirect("/");
  }

  const workspaces = await prisma.workspace.findMany({
    select: { name: true, slug: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/f-t-logo.png"
              alt="FamilyTable"
              width={180}
              height={48}
              className="h-10 w-auto"
              priority
            />
            <span className="text-sm font-semibold text-slate-600">
              Admin portal
            </span>
          </div>
          <div className="flex items-center gap-3">
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20">
                Workspaces
                <svg
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  className="h-3.5 w-3.5 text-slate-400"
                >
                  <path
                    fill="currentColor"
                    d="M4.47 6.97a.75.75 0 0 1 1.06 0L8 9.44l2.47-2.47a.75.75 0 1 1 1.06 1.06l-3 3a.75.75 0 0 1-1.06 0l-3-3a.75.75 0 0 1 0-1.06Z"
                  />
                </svg>
              </summary>
              <div className="absolute right-0 z-10 mt-2 min-w-[12rem] rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Switch workspace
                </p>
                <div className="grid gap-1">
                  {workspaces.length ? (
                    workspaces.map((workspace) => (
                      <Link
                        key={workspace.slug}
                        href={`/g/${workspace.slug}/cook`}
                        className="rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                      >
                        {workspace.name}
                      </Link>
                    ))
                  ) : (
                    <span className="rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-400">
                      No workspaces yet.
                    </span>
                  )}
                </div>
              </div>
            </details>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
