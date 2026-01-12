"use server";

import { z } from "zod";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { hashPassword, normalizeEmail, requireAdmin } from "@/lib/auth";

type ActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; message?: string };

const workspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required."),
});

const userSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  workspaceId: z.string().optional(),
});

function generateWorkspaceSlug() {
  return crypto.randomBytes(16).toString("hex");
}

export async function createWorkspaceAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = workspaceSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Workspace name is required.";
    return { status: "error", message };
  }

  const name = parsed.data.name.trim();
  if (!name) {
    return { status: "error", message: "Workspace name is required." };
  }

  let slug = generateWorkspaceSlug();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await prisma.workspace.create({
        data: { name, slug },
      });
      revalidatePath("/admin");
      return { status: "success" };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        slug = generateWorkspaceSlug();
        continue;
      }
      throw error;
    }
  }

  return { status: "error", message: "Could not generate a unique slug." };
}

export async function deleteWorkspaceAction(formData: FormData) {
  await requireAdmin();
  const workspaceId = formData.get("workspaceId");
  if (typeof workspaceId !== "string" || !workspaceId) {
    throw new Error("Workspace not found");
  }

  await prisma.user.updateMany({
    where: { workspaceId },
    data: { workspaceId: null },
  });

  await prisma.workspace.delete({
    where: { id: workspaceId },
  });

  revalidatePath("/admin");
}

export async function createUserAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = userSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    workspaceId: formData.get("workspaceId") || undefined,
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid user details.";
    return { status: "error", message };
  }

  const email = normalizeEmail(parsed.data.email);
  const passwordHash = await hashPassword(parsed.data.password);
  const workspaceId = parsed.data.workspaceId || null;

  try {
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        workspaceId,
        isAdmin: false,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { status: "error", message: "Email already exists." };
    }
    throw error;
  }

  revalidatePath("/admin");
  return { status: "success" };
}

export async function deleteUserAction(formData: FormData) {
  await requireAdmin();
  const userId = formData.get("userId");
  if (typeof userId !== "string" || !userId) {
    throw new Error("User not found");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.isAdmin) {
    throw new Error("Cannot delete admin user");
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  revalidatePath("/admin");
}

export async function updateUserWorkspaceAction(formData: FormData) {
  await requireAdmin();
  const userId = formData.get("userId");
  const workspaceIdValue = formData.get("workspaceId");

  if (typeof userId !== "string" || !userId) {
    throw new Error("User not found");
  }

  const workspaceId =
    typeof workspaceIdValue === "string" && workspaceIdValue
      ? workspaceIdValue
      : null;

  await prisma.user.update({
    where: { id: userId },
    data: { workspaceId },
  });

  revalidatePath("/admin");
}
