import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const APP_ROOT = "https://app.familytable.me/";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/login" || pathname === "/app/login" || pathname === "/sign-in") {
    return NextResponse.redirect(APP_ROOT, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/app/login", "/sign-in"],
};
