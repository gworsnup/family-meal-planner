import { prisma } from "@/lib/db";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const workspace = await prisma.workspace.findUnique({ where: { slug } });
  if (!workspace) {
    return <div style={{ padding: 24 }}>Workspace not found.</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>{workspace.name}</h1>
      <p>✅ Signed in.</p>
      <p>Next: we’ll build Recipes / Plan / Shopping List under this workspace.</p>
    </div>
  );
}
