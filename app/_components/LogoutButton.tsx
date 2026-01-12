import { logoutAction } from "@/app/actions/auth";

type LogoutButtonProps = {
  className?: string;
};

export default function LogoutButton({ className }: LogoutButtonProps) {
  return (
    <form action={logoutAction} className={className}>
      <button className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20">
        Log out
      </button>
    </form>
  );
}
