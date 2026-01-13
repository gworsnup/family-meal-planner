import crypto from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";

const SESSION_COOKIE = "session";
const SESSION_DURATION_DAYS = 30;

export type CurrentUser = {
  id: string;
  email: string;
  isAdmin: boolean;
  hasCreatedWorkspace: boolean;
  workspace: { id: string; slug: string; name: string } | null;
};

export type WorkspaceUser = Omit<CurrentUser, "workspace"> & {
  workspace: { id: string; slug: string; name: string };
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function generateToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function sessionExpiryDate() {
  return new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);
}

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(hash: string, password: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = generateToken();
  const tokenHash = sha256(token);
  const expiresAt = sessionExpiryDate();

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = sha256(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: {
          workspace: {
            select: { id: true, slug: true, name: true },
          },
        },
      },
    },
  });

  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    isAdmin: session.user.isAdmin,
    hasCreatedWorkspace: session.user.hasCreatedWorkspace,
    workspace: session.user.workspace
      ? {
          id: session.user.workspace.id,
          slug: session.user.workspace.slug,
          name: session.user.workspace.name,
        }
      : null,
  };
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !user.isAdmin) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireWorkspaceUser(slug: string): Promise<WorkspaceUser> {
  const user = await getCurrentUser();
  if (!user?.workspace || user.workspace.slug !== slug) {
    throw new Error("Unauthorized");
  }
  return user as WorkspaceUser;
}

export function isSafeRedirect(value?: string | null) {
  if (!value) return false;
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//")) return false;
  return true;
}
