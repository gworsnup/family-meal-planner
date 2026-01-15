import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";

import LoginForm from "@/app/_components/LoginForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const user = await getCurrentUser();

  if (user) {
    if (user.isAdmin) {
      redirect("/admin");
    }
    if (user.workspace) {
      redirect(`/g/${user.workspace.slug}/cook`);
    }
    if (user.hasCreatedWorkspace) {
      redirect("/onboarding/locked");
    }
    redirect("/onboarding/household");
  }

  const next =
    typeof searchParams.next === "string" ? searchParams.next : undefined;
  const message =
    typeof searchParams.message === "string" ? searchParams.message : undefined;
  const error =
    typeof searchParams.error === "string" ? searchParams.error : undefined;

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <main className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/f-t-logo.png"
            alt="FamilyTable"
            width={200}
            height={60}
            priority
            className="h-[calc(var(--spacing)*20)] w-auto"
          />
          <p className="mt-3 text-sm font-semibold text-slate-700">
            A shared meal planner for your household.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Save recipes from TikTok, Instagram, and any site — then plan your
            week in minutes.
          </p>
          <p className="mt-4 text-sm text-slate-500">
            Sign in to plan meals with your household.
          </p>
        </div>

        <LoginForm next={next} message={error ?? message} />
      </main>
    </div>
  );
}
