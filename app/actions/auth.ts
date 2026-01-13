"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { prisma } from "@/lib/db";
import {
  clearSessionCookie,
  createSession,
  isSafeRedirect,
  normalizeEmail,
  setSessionCookie,
  sha256,
  verifyPassword,
} from "@/lib/auth";

type LoginState =
  | { status: "idle" }
  | { status: "error"; message: string };

const loginSchema = z.object({
  email: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : ""),
    z.string().email("Enter a valid email address."),
  ),
  password: z.preprocess(
    (value) => (typeof value === "string" ? value : ""),
    z.string().min(8, "Password must be at least 8 characters."),
  ),
  next: z.preprocess(
    (value) => (typeof value === "string" ? value : undefined),
    z.string().optional(),
  ),
});

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid login details.";
    return { status: "error", message };
  }

  const email = normalizeEmail(parsed.data.email);
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      workspace: {
        select: { id: true, slug: true, name: true },
      },
    },
  });

  if (!user) {
    return { status: "error", message: "Invalid email or password." };
  }

  if (!user.passwordHash) {
    return { status: "error", message: "Invalid email or password." };
  }

  const passwordOk = await verifyPassword(
    user.passwordHash,
    parsed.data.password,
  );
  if (!passwordOk) {
    return { status: "error", message: "Invalid email or password." };
  }

  const { token, expiresAt } = await createSession(user.id);
  await setSessionCookie(token, expiresAt);

  const next = isSafeRedirect(parsed.data.next) ? parsed.data.next : null;

  if (next) {
    redirect(next);
  }

  if (user.isAdmin) {
    redirect("/admin");
  }

  if (user.workspace) {
    redirect(`/g/${user.workspace.slug}/cook`);
  }

  if (user.hasCreatedWorkspace) {
    redirect("/onboarding/locked");
  }

  redirect("/onboarding/household");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (token) {
    await prisma.session.deleteMany({
      where: { tokenHash: sha256(token) },
    });
  }
  await clearSessionCookie();
  redirect("/");
}
