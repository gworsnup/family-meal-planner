import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import {
  createSession,
  normalizeEmail,
  sessionCookieOptions,
} from "@/lib/auth";

type TokenInfoResponse = {
  sub?: string;
  email?: string;
  email_verified?: string | boolean;
  aud?: string;
};

type TokenResponse = {
  id_token?: string;
};

function redirectWithError(request: NextRequest, message: string) {
  const baseUrl = process.env.APP_BASE_URL ?? request.nextUrl.origin;
  const url = new URL("/", baseUrl);
  url.searchParams.set("error", message);
  const response = NextResponse.redirect(url);
  response.cookies.delete("google_oauth_state");
  response.cookies.delete("google_oauth_code_verifier");
  return response;
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("Google OAuth callback failed: missing client config.", {
      hasClientId: Boolean(clientId),
      hasClientSecret: Boolean(clientSecret),
    });
    return redirectWithError(
      request,
      "Google sign-in is not configured. Contact support.",
    );
  }

  const oauthError = request.nextUrl.searchParams.get("error");
  if (oauthError) {
    console.warn("Google OAuth callback error from provider.", { oauthError });
    return redirectWithError(request, "Google sign-in was cancelled.");
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get("google_oauth_state")?.value;
  const codeVerifier = request.cookies.get("google_oauth_code_verifier")?.value;

  if (!code || !state || !storedState || state !== storedState || !codeVerifier) {
    return redirectWithError(request, "Google sign-in failed. Try again.");
  }

  const baseUrl = process.env.APP_BASE_URL ?? request.nextUrl.origin;
  const redirectUri = `${baseUrl}/auth/google/callback`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenResponse.ok) {
    return redirectWithError(request, "Google sign-in failed. Try again.");
  }

  const tokenData = (await tokenResponse.json()) as TokenResponse;
  if (!tokenData.id_token) {
    return redirectWithError(request, "Google sign-in failed. Try again.");
  }

  const tokenInfoResponse = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
      tokenData.id_token,
    )}`,
  );

  if (!tokenInfoResponse.ok) {
    return redirectWithError(request, "Google sign-in failed. Try again.");
  }

  const tokenInfo = (await tokenInfoResponse.json()) as TokenInfoResponse;
  if (!tokenInfo.sub) {
    return redirectWithError(request, "Google sign-in failed. Try again.");
  }

  if (tokenInfo.aud !== clientId) {
    return redirectWithError(request, "Google sign-in failed. Try again.");
  }

  const emailVerified =
    tokenInfo.email_verified === true || tokenInfo.email_verified === "true";
  if (!emailVerified || !tokenInfo.email) {
    return redirectWithError(request, "Google sign-in requires a verified email.");
  }

  const email = normalizeEmail(tokenInfo.email);

  let userId: string;
  const existingAccount = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: "google",
        providerAccountId: tokenInfo.sub,
      },
    },
    include: { user: true },
  });

  if (existingAccount) {
    if (existingAccount.user.isAdmin) {
      return redirectWithError(
        request,
        "Admin accounts must sign in with email and password.",
      );
    }
    userId = existingAccount.userId;
  } else {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser?.isAdmin) {
      return redirectWithError(
        request,
        "Admin accounts must sign in with email and password.",
      );
    }

    const user = existingUser
      ? existingUser
      : await prisma.user.create({
          data: {
            email,
            passwordHash: null,
            isAdmin: false,
            workspaceId: null,
            hasCreatedWorkspace: false,
          },
        });

    await prisma.oAuthAccount.create({
      data: {
        provider: "google",
        providerAccountId: tokenInfo.sub,
        userId: user.id,
      },
    });

    userId = user.id;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { workspace: { select: { slug: true } } },
  });

  if (!user) {
    return redirectWithError(request, "Google sign-in failed. Try again.");
  }

  const { token, expiresAt } = await createSession(user.id);

  const redirectPath = user.workspace
    ? `/g/${user.workspace.slug}/cook`
    : user.hasCreatedWorkspace
      ? "/onboarding/locked"
      : "/onboarding/household";

  const response = NextResponse.redirect(new URL(redirectPath, baseUrl));
  response.cookies.set("session", token, sessionCookieOptions(expiresAt));
  response.cookies.delete("google_oauth_state");
  response.cookies.delete("google_oauth_code_verifier");
  return response;
}
