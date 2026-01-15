"use server";

import crypto from "crypto";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { seedDefaultTagsForWorkspace } from "@/lib/seedDefaultTagsForWorkspace";

type ActionState =
  | { status: "idle" }
  | { status: "error"; message: string };

const householdSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Household name must be at least 2 characters.")
    .max(60, "Household name must be at most 60 characters."),
});

function generateWorkspaceSlug() {
  return crypto.randomBytes(16).toString("hex");
}

export async function createHouseholdAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/?next=/onboarding/household");
  }

  if (user.isAdmin) {
    redirect("/admin");
  }

  const parsed = householdSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Enter a household name.";
    return { status: "error", message };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { workspaceId: true, hasCreatedWorkspace: true },
  });

  if (!dbUser) {
    return { status: "error", message: "User not found." };
  }

  if (dbUser.workspaceId) {
    return { status: "error", message: "You already belong to a household." };
  }

  if (dbUser.hasCreatedWorkspace) {
    redirect("/onboarding/locked");
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const slug = generateWorkspaceSlug();
    try {
      const workspace = await prisma.$transaction(async (tx) => {
        const createdWorkspace = await tx.workspace.create({
          data: { name: parsed.data.name.trim(), slug },
        });

        await tx.user.update({
          where: { id: user.id },
          data: {
            workspaceId: createdWorkspace.id,
            hasCreatedWorkspace: true,
          },
        });

        return createdWorkspace;
      });

      try {
        await seedDefaultTagsForWorkspace(workspace.id);
      } catch (error) {
        console.error("Failed to seed default tags", {
          error,
          workspaceId: workspace.id,
        });
      }

      redirect(`/g/${workspace.slug}/cook`);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        continue;
      }
      throw error;
    }
  }

  return { status: "error", message: "Could not create household." };
}
