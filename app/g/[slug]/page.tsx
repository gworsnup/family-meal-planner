import { cookies } from "next/headers";
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

  const cookieStore = await cookies();
  const authed = cookieStore.get(`wsp_${slug}`)?.value === "1";

  if (!authed) {
    return (
      <div style={{ padding: 24, maxWidth: 420 }}>
        <h1>{workspace.name}</h1>
        <p>Enter passcode to continue.</p>

        <form action={`/api/workspace/${slug}/login`} method="post">
          <input
            name="passcode"
            type="password"
            placeholder="Passcode"
            autoFocus
            style={{ padding: 12, width: "100%", marginTop: 12 }}
          />
          <button style={{ marginTop: 12, padding: 12, width: "100%" }}>
            Unlock
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>{workspace.name}</h1>
      <p>✅ Unlocked.</p>
      <p>Next: we’ll build Recipes / Plan / Shopping List under this workspace.</p>
    </div>
  );
}
