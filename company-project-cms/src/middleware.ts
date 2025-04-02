import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // List of paths that do not require authentication
  const publicPaths = ["/sign-in", "/signup"];

  // Allow API authentication endpoints without session validation
  const apiAuthPaths = ["/api/auth/", "/api/auth/**"];

  // Skip middleware for public paths or API authentication paths
  if (
    publicPaths.some((path) => pathname.startsWith(path)) ||
    apiAuthPaths.some((path) => pathname.startsWith(path.replace("**", "")))
  ) {
    return NextResponse.next(); // No session validation for these paths
  }

  // Check for token in cookies
  const token = request.cookies.get("accessToken")?.value || "";

  // Redirect to the login page if the token is invalid
  if (!token) {
    if (!pathname.startsWith("/sign-in")) {
      // Prevent redirect loop for /login
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }
    return NextResponse.next();
  }

  // Allow access if the token is valid
  return NextResponse.next();
}

// Config to match specific paths for the middleware
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
