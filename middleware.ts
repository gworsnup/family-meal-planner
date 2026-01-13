import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isOnboardingRoute = pathname.startsWith("/onboarding");
  const isWorkspaceRoute = pathname.startsWith("/g/");

  if (isAdminRoute || isWorkspaceRoute || isOnboardingRoute) {
    const session = request.cookies.get("session")?.value;
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.delete("message");
      if (isWorkspaceRoute || isOnboardingRoute) {
        url.searchParams.set("next", `${pathname}${search}`);
      }
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/g/:path*", "/onboarding/:path*"],
};
