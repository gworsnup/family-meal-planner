import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

function formatSource(sourceName?: string | null, sourceUrl?: string | null) {
  if (sourceName?.trim()) return sourceName;
  if (sourceUrl) {
    try {
      const url = new URL(sourceUrl);
      return url.hostname.replace(/^www\./, "");
    } catch {
      return sourceUrl;
    }
  }
  return "—";
}

function formatMinutes(minutes?: number | null) {
  if (minutes === null || minutes === undefined) return "—";
  return `${minutes} min`;
}

function formatUpdated(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function CookPage({
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

  const recipes = await prisma.recipe.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0 }}>{workspace.name} · Cook</h1>
          <p style={{ marginTop: 4, color: "#555" }}>Recipes in this workspace.</p>
        </div>
        <Link
          href={`/g/${slug}/cook/new`}
          style={{ padding: "10px 14px", background: "#0f766e", color: "white", borderRadius: 6, textDecoration: "none" }}
        >
          Add recipe
        </Link>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th style={{ padding: "10px 6px" }}>Title</th>
              <th style={{ padding: "10px 6px" }}>Source</th>
              <th style={{ padding: "10px 6px" }}>Rating</th>
              <th style={{ padding: "10px 6px" }}>Total time</th>
              <th style={{ padding: "10px 6px" }}>Updated</th>
            </tr>
          </thead>
          <tbody>
            {recipes.map((recipe) => (
              <tr key={recipe.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "10px 6px", fontWeight: 600 }}>{recipe.title}</td>
                <td style={{ padding: "10px 6px", color: "#333" }}>
                  {formatSource(recipe.sourceName, recipe.sourceUrl)}
                </td>
                <td style={{ padding: "10px 6px" }}>{recipe.rating ?? "—"}</td>
                <td style={{ padding: "10px 6px" }}>
                  {formatMinutes(recipe.totalTimeMinutes ?? recipe.cookTimeMinutes ?? recipe.prepTimeMinutes)}
                </td>
                <td style={{ padding: "10px 6px", color: "#555" }}>
                  {formatUpdated(recipe.updatedAt)}
                </td>
              </tr>
            ))}
            {recipes.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 16, color: "#555" }}>
                  No recipes yet. Add your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
