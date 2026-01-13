import Image from "next/image";
import { redirect } from "next/navigation";

import LogoutButton from "@/app/_components/LogoutButton";
import { getCurrentUser } from "@/lib/auth";

export default async function LockedOnboardingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/?next=/onboarding/locked");
  }

  if (user.isAdmin) {
    redirect("/admin");
  }

  if (user.workspace) {
    redirect(`/g/${user.workspace.slug}/cook`);
  }

  if (!user.hasCreatedWorkspace) {
    redirect("/onboarding/household");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <main className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 text-center">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/f-t-logo.png"
            alt="FamilyTable"
            width={200}
            height={60}
            priority
            className="h-[calc(var(--spacing)*20)] w-auto"
          />
          <h1 className="mt-4 text-xl font-semibold text-slate-900">
            Workspace unavailable
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Your workspace was removed or is no longer assigned. Ask an admin to
            reassign you to a household.
          </p>
        </div>
        <div className="mt-6 flex justify-center">
          <LogoutButton />
        </div>
      </main>
    </div>
  );
}
