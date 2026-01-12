import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";

import { SetupForm } from "./SetupForm";

function randomSlug() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

type SetupState =
  | { status: "idle" }
  | { status: "success"; workspaceSlug: string }
  | { status: "error"; message: string };

async function setupWorkspace(_prevState: SetupState, formData: FormData): Promise<SetupState> {
  "use server";

  const expectedSecret = process.env.SETUP_SECRET;

  if (!expectedSecret) {
    notFound();
  }

  if (formData.get("secret") !== expectedSecret) {
    notFound();
  }

  const name = (formData.get("name") as string | null)?.trim();

  if (!name) {
    return { status: "error", message: "Name is required." };
  }

  const existing = await prisma.workspace.findFirst();
  const slug = existing?.slug ?? randomSlug();

  const workspace = await prisma.workspace.upsert({
    where: { slug },
    update: { name },
    create: { slug, name },
  });

  return { status: "success", workspaceSlug: workspace.slug };
}

export default async function SetupPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const expectedSecret = process.env.SETUP_SECRET;

  if (!expectedSecret) {
    notFound();
  }

  const providedSecret = Array.isArray(searchParams.secret)
    ? searchParams.secret[0]
    : searchParams.secret;

  if (providedSecret !== expectedSecret) {
    notFound();
  }

  const existing = await prisma.workspace.findFirst();

  return (
    <div style={{ padding: 24, maxWidth: 720 }}>
      <h1>Workspace setup</h1>
      <p style={{ marginBottom: 16 }}>
        Create or update your workspace. This page is protected by the setup secret and
        should be removed or locked down after initial configuration.
      </p>

      <SetupForm
        action={setupWorkspace}
        secret={providedSecret}
        defaultName={existing?.name ?? "Household"}
      />
    </div>
  );
}
