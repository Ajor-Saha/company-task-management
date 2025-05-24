import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect root to home page
  if (pathname === "/" || pathname === "") {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // List of paths that do not require authentication
  const publicPaths = ["/home", "/sign-in", "/signup/:companyId", "/verify/:email", "/create-new-company"];

  // Auth-only paths (logged in users shouldn't access these)
  const authOnlyPaths = ["/sign-in", "/signup", "/create-new-company"];

  // Allow API authentication endpoints without session validation
  const apiAuthPaths = ["/api/auth/", "/api/auth/**"];

  // Check for token in cookies
  const token = request.cookies.get("accessToken")?.value || "";
  const isAuthenticated = !!token;

  // For public paths or API auth paths, allow access without token validation
  if (
    publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`)) ||
    apiAuthPaths.some((path) => pathname.startsWith(path.replace("**", "")))
  ) {
    // If user is authenticated and trying to access auth-only pages, redirect to home
    if (
      isAuthenticated &&
      authOnlyPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
    ) {
      return NextResponse.redirect(new URL("/home", request.url));
    }
    
    return NextResponse.next(); // No further validation needed for public paths
  }

  // For private paths, check if user is authenticated
  if (!isAuthenticated) {
    // Redirect to login if no token found
    return NextResponse.redirect(new URL("/sign-in", request.url));
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
