import Link from "next/link";

type WorkspaceHeaderProps = {
  slug: string;
  workspaceName: string;
  current?: "recipes" | "plan" | "shopping";
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
  current = "recipes",
}: WorkspaceHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <div className="flex items-center gap-3">
          <img
            src="/brand/familytable-logo.svg"
            alt="Family Table logo"
            className="h-10 w-auto"
          />
          <div className="leading-tight">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Workspace
            </p>
            <p className="text-sm font-medium text-slate-700">{workspaceName}</p>
          </div>
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
                    ? "bg-emerald-50 text-emerald-700 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={`/g/${slug}/cook`}
            className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm md:hidden"
          >
            Recipes
          </Link>
          <button
            type="button"
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:border-slate-300 hover:text-slate-900"
          >
            Account
          </button>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-white md:hidden">
        <nav className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto px-6 py-3 text-sm font-medium text-slate-600">
          {navItems.map((item) => {
            const isActive = current === item.key;
            return (
              <Link
                key={item.key}
                href={item.href(slug)}
                aria-current={isActive ? "page" : undefined}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 transition ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 shadow-sm"
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
