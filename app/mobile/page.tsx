import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function MobileHome() {
  const user = await getCurrentUser();

  if (!user) redirect("/?next=/mobile");
  if (user.isAdmin) redirect("/admin");
  if (!user.workspace) {
    redirect(user.hasCreatedWorkspace ? "/onboarding/locked" : "/onboarding/household");
  }

  redirect(`/mobile/${user.workspace.slug}/plan`);
}
