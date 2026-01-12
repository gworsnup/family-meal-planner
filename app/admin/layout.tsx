import Image from "next/image";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
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

  return (
    <div className="min-h-screen bg-slate-50">
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
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
