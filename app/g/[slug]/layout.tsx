import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import SmartListJobNotifier from "@/app/_components/SmartListJobNotifier";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/?next=/g/${slug}`);
  }

  if (!user.isAdmin) {
    if (!user.workspace) {
      if (user.hasCreatedWorkspace) {
        redirect("/onboarding/locked");
      }
      redirect("/onboarding/household");
    }

    if (user.workspace.slug !== slug) {
      redirect(`/g/${user.workspace.slug}/`);
    }
  }

  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    select: { id: true },
  });

  return (
    <>
      {children}
      {workspace ? (
        <SmartListJobNotifier workspaceId={workspace.id} workspaceSlug={slug} />
      ) : null}
    </>
  );
}
