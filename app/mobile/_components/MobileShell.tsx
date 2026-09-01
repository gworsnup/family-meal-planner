"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";

type MobileShellProps = {
  slug: string;
  workspaceName: string;
  children: React.ReactNode;
};

const navItems = [
  {
    key: "plan",
    label: "This week",
    path: "plan",
    icon: (
      <path d="M7 2v3M17 2v3M3.5 9h17M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
    ),
  },
  {
    key: "recipes",
    label: "Recipes",
    path: "recipes",
    icon: (
      <path d="M6 3h12a2 2 0 0 1 2 2v16l-8-4-8 4V5a2 2 0 0 1 2-2Zm2 5h8M8 11h6" />
    ),
  },
  {
    key: "import",
    label: "Import",
    path: "import",
    icon: <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 18v3h16v-3" />,
  },
  {
    key: "shopping-list",
    label: "Shop",
    path: "shopping-list",
    icon: <path d="M3 4h2l2 12h10l3-8H6m3 12a1 1 0 1 0 0 .01M17 20a1 1 0 1 0 0 .01" />,
  },
] as const;

export default function MobileShell({ slug, workspaceName, children }: MobileShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href={`/mobile/${slug}/plan`} aria-label="FamilyTable home">
            <Image
              src="/f-t-logo.png"
              alt="FamilyTable"
              width={150}
              height={34}
              priority
              className="h-8 w-auto"
            />
          </Link>
          <details className="relative">
            <summary className="flex max-w-40 cursor-pointer list-none items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
              <span className="truncate">{workspaceName}</span>
              <span aria-hidden="true">⌄</span>
            </summary>
            <div className="absolute right-0 mt-2 w-40 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
              <Link
                href={`/g/${slug}/cook`}
                className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Desktop app
              </Link>
              <form action={logoutAction}>
                <button className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100">
                  Log out
                </button>
              </form>
            </div>
          </details>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-5">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur" aria-label="Mobile navigation">
        <div className="mx-auto grid max-w-2xl grid-cols-4">
          {navItems.map((item) => {
            const href = `/mobile/${slug}/${item.path}`;
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={item.key}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[11px] font-semibold ${
                  active ? "text-slate-950" : "text-slate-400"
                }`}
              >
                <span className={`flex h-7 w-10 items-center justify-center rounded-full ${active ? "bg-slate-900 text-white" : ""}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                    {item.icon}
                  </svg>
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
