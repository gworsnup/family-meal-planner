import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

function parseOptionalInt(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseOptionalString(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export default async function NewRecipePage({
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

  async function createRecipe(formData: FormData) {
    "use server";

    const cookieStoreForAction = await cookies();
    const authedForAction = cookieStoreForAction.get(`wsp_${slug}`)?.value === "1";
    if (!authedForAction) {
      return redirect(`/g/${slug}`);
    }

    const workspaceForAction = await prisma.workspace.findUnique({ where: { slug } });
    if (!workspaceForAction) {
      return redirect("/g/" + slug);
    }

    const title = formData.get("title")?.toString().trim();
    if (!title) {
      throw new Error("Title is required");
    }

    const prepTimeMinutes = parseOptionalInt(formData.get("prepTimeMinutes"));
    const cookTimeMinutes = parseOptionalInt(formData.get("cookTimeMinutes"));
    const totalTimeMinutes = parseOptionalInt(formData.get("totalTimeMinutes"));
    const rating = parseOptionalInt(formData.get("rating"));

    await prisma.recipe.create({
      data: {
        workspaceId: workspaceForAction.id,
        title,
        sourceUrl: parseOptionalString(formData.get("sourceUrl")),
        photoUrl: parseOptionalString(formData.get("photoUrl")),
        prepTimeMinutes,
        cookTimeMinutes,
        totalTimeMinutes,
        servings: parseOptionalString(formData.get("servings")),
        yields: parseOptionalString(formData.get("yields")),
        rating,
        directions: parseOptionalString(formData.get("directions")),
        ingredientLines: {
          create: (formData.get("ingredients")?.toString() || "")
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((ingredient, index) => ({
              position: index + 1,
              ingredient,
            })),
        },
      },
    });

    redirect(`/g/${slug}/cook`);
  }

  return (
    <div style={{ padding: 24, maxWidth: 760, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0 }}>Add recipe</h1>
          <p style={{ marginTop: 4, color: "#555" }}>to {workspace.name}</p>
        </div>
        <Link href={`/g/${slug}/cook`} style={{ color: "#0f766e", textDecoration: "none" }}>
          ← Back to Cook
        </Link>
      </div>

      <form action={createRecipe} style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <label htmlFor="title" style={{ fontWeight: 600 }}>
            Title *
          </label>
          <input
            id="title"
            name="title"
            required
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 6 }}
            placeholder="Recipe title"
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label htmlFor="sourceUrl" style={{ fontWeight: 600 }}>
            Source URL
          </label>
          <input
            id="sourceUrl"
            name="sourceUrl"
            type="url"
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 6 }}
            placeholder="https://example.com/recipe"
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label htmlFor="photoUrl" style={{ fontWeight: 600 }}>
            Photo URL
          </label>
          <input
            id="photoUrl"
            name="photoUrl"
            type="url"
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 6 }}
            placeholder="https://example.com/photo.jpg"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <label htmlFor="prepTimeMinutes" style={{ fontWeight: 600 }}>
              Prep time (minutes)
            </label>
            <input
              id="prepTimeMinutes"
              name="prepTimeMinutes"
              type="number"
              min="0"
              style={{ padding: 10, border: "1px solid #ccc", borderRadius: 6 }}
              placeholder="15"
            />
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <label htmlFor="cookTimeMinutes" style={{ fontWeight: 600 }}>
              Cook time (minutes)
            </label>
            <input
              id="cookTimeMinutes"
              name="cookTimeMinutes"
              type="number"
              min="0"
              style={{ padding: 10, border: "1px solid #ccc", borderRadius: 6 }}
              placeholder="30"
            />
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <label htmlFor="totalTimeMinutes" style={{ fontWeight: 600 }}>
              Total time (minutes)
            </label>
            <input
              id="totalTimeMinutes"
              name="totalTimeMinutes"
              type="number"
              min="0"
              style={{ padding: 10, border: "1px solid #ccc", borderRadius: 6 }}
              placeholder="45"
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <label htmlFor="servings" style={{ fontWeight: 600 }}>
              Servings
            </label>
            <input
              id="servings"
              name="servings"
              style={{ padding: 10, border: "1px solid #ccc", borderRadius: 6 }}
              placeholder="4"
            />
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <label htmlFor="yields" style={{ fontWeight: 600 }}>
              Yields
            </label>
            <input
              id="yields"
              name="yields"
              style={{ padding: 10, border: "1px solid #ccc", borderRadius: 6 }}
              placeholder="1 loaf"
            />
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <label htmlFor="rating" style={{ fontWeight: 600 }}>
              Rating (0-5)
            </label>
            <input
              id="rating"
              name="rating"
              type="number"
              min="0"
              max="5"
              style={{ padding: 10, border: "1px solid #ccc", borderRadius: 6 }}
              placeholder="5"
            />
          </div>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label htmlFor="ingredients" style={{ fontWeight: 600 }}>
            Ingredients (one per line)
          </label>
          <textarea
            id="ingredients"
            name="ingredients"
            rows={6}
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 6 }}
            placeholder={"2 cups flour\n1 tsp salt\n1 cup water"}
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label htmlFor="directions" style={{ fontWeight: 600 }}>
            Directions
          </label>
          <textarea
            id="directions"
            name="directions"
            rows={6}
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 6 }}
            placeholder="Write out the steps"
          />
        </div>

        <button
          type="submit"
          style={{
            padding: "12px 16px",
            background: "#0f766e",
            color: "white",
            border: "none",
            borderRadius: 6,
            fontWeight: 600,
            cursor: "pointer",
            width: "fit-content",
          }}
        >
          Save recipe
        </button>
      </form>
    </div>
  );
}
