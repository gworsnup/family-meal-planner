import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

function base64UrlEncode(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("error", "Google sign-in is not configured.");
    return NextResponse.redirect(url);
  }

  const baseUrl = process.env.APP_BASE_URL ?? request.nextUrl.origin;
  const redirectUri = `${baseUrl}/auth/google/callback`;

  const state = crypto.randomBytes(16).toString("hex");
  const codeVerifier = base64UrlEncode(crypto.randomBytes(32));
  const codeChallenge = base64UrlEncode(
    crypto.createHash("sha256").update(codeVerifier).digest(),
  );

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const response = NextResponse.redirect(
    `${GOOGLE_AUTH_URL}?${params.toString()}`,
  );

  const expires = new Date(Date.now() + 10 * 60 * 1000);
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    expires,
    path: "/",
  };

  response.cookies.set("google_oauth_state", state, cookieOptions);
  response.cookies.set("google_oauth_code_verifier", codeVerifier, cookieOptions);

  return response;
}
