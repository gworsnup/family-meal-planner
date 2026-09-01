import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import MobileShell from "../_components/MobileShell";

export default async function MobileWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();

  if (!user) redirect(`/?next=/mobile/${slug}/plan`);
  if (user.isAdmin) redirect("/admin");
  if (!user.workspace) {
    redirect(user.hasCreatedWorkspace ? "/onboarding/locked" : "/onboarding/household");
  }
  if (user.workspace.slug !== slug) redirect(`/mobile/${user.workspace.slug}/plan`);

  return (
    <MobileShell slug={slug} workspaceName={user.workspace.name}>
      {children}
    </MobileShell>
  );
}
