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

  // Check for token in cookies and Authorization header
  const token = request.cookies.get("accessToken")?.value || 
                request.headers.get("Authorization")?.replace("Bearer ", "") || "";

  const response = NextResponse.next();

  // Set cookie with cross-subdomain support if token exists but cookie doesn't
  if (token && !request.cookies.get("accessToken")) {
    response.cookies.set({
      name: "accessToken",
      value: token,
      domain: ".taskforges.com", // Use root domain to enable sharing between subdomains
      path: "/",
      secure: true,
      sameSite: "none",
      httpOnly: true
    });
  }

  // Redirect to the login page if the token is invalid
  if (!token) {
    if (!pathname.startsWith("/sign-in")) {
      // Prevent redirect loop for /login
      const redirectResponse = NextResponse.redirect(new URL("/sign-in", request.url));
      // Copy any existing cookies to the redirect response
      response.cookies.getAll().forEach(cookie => {
        redirectResponse.cookies.set(cookie);
      });
      return redirectResponse;
    }
    return response;
  }

  // Allow access if the token is valid
  return response;
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
