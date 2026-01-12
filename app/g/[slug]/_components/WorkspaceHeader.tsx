import Image from "next/image";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";

type WorkspaceHeaderProps = {
  slug: string;
  workspaceName: string;
  workspaces: Array<{ slug: string; name: string }>;
  isAdmin: boolean;
  current?: "recipes" | "plan" | "shopping";
  showLogout?: boolean;
};

const navItems = [
  { key: "recipes", label: "Recipes", href: (slug: string) => `/g/${slug}/cook` },
  { key: "plan", label: "Plan", href: (slug: string) => `/g/${slug}/plan` },
  {
    key: "shopping",
    label: "Shopping List",
    href: (slug: string) => `/g/${slug}/shopping-list`,
  },
] as const;

export default function WorkspaceHeader({
  slug,
  workspaceName,
  workspaces,
  isAdmin,
  current = "recipes",
  showLogout = true,
}: WorkspaceHeaderProps) {
  const activeNav =
    navItems.find((item) => item.key === current) ?? navItems[0];

  const workspaceHref = (targetSlug: string) => activeNav.href(targetSlug);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <Image
            src="/f-t-logo.png"
            alt="FamilyTable"
            width={180}
            height={48}
            priority
            className="h-10 w-auto"
          />
        </div>

        <nav className="hidden items-center gap-2 text-sm font-medium text-slate-600 md:flex">
          {navItems.map((item) => {
            const isActive = current === item.key;
            return (
              <Link
                key={item.key}
                href={item.href(slug)}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-full px-4 py-2 transition ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {isAdmin ? (
            <Link
              href="/admin"
              aria-label="Admin panel"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-4 w-4"
              >
                <path
                  fill="currentColor"
                  d="M12 3 4 6v6c0 5 3.4 9.2 8 10.5 4.6-1.3 8-5.5 8-10.5V6l-8-3Zm0 15.3-3.5-3.5 1.4-1.4L12 14.4l4.1-4.1 1.4 1.4-5.5 5.6Z"
                />
              </svg>
            </Link>
          ) : null}
          {showLogout ? (
            <form action={logoutAction}>
              <button className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20">
                Log out
              </button>
            </form>
          ) : null}
          <Link
            href={`/g/${slug}/cook`}
            className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white md:hidden"
          >
            Recipes
          </Link>
          {isAdmin ? (
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20">
                {workspaceName}
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
                  {workspaces.map((workspace) => {
                    const isCurrent = workspace.slug === slug;
                    return (
                      <Link
                        key={workspace.slug}
                        href={workspaceHref(workspace.slug)}
                        className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
                          isCurrent
                            ? "bg-slate-900 text-white"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        {workspace.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </details>
          ) : (
            <span className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600">
              {workspaceName}
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 bg-white md:hidden">
        <nav className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-6 py-3 text-sm font-medium text-slate-600 sm:px-8">
          {navItems.map((item) => {
            const isActive = current === item.key;
            return (
              <Link
                key={item.key}
                href={item.href(slug)}
                aria-current={isActive ? "page" : undefined}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 transition ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
