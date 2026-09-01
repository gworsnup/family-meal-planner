import { redirect } from "next/navigation";
import { getWorkspaceUser } from "@/lib/auth";
import MobileShell from "../_components/MobileShell";

export default async function MobileWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getWorkspaceUser(slug);

  if (!user) redirect(`/?next=/mobile/${slug}/plan`);

  return (
    <MobileShell slug={slug} workspaceName={user.workspace.name}>
      {children}
    </MobileShell>
  );
}
