import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Define public paths where no authentication is required
  const publicPaths = ['/sign-in', '/signup', '/verify', '/']
  const isPublicPath = publicPaths.includes(path)

  const token = request.cookies.get('accessToken')?.value || ''

  // If the user is already logged in (has a token) and trying to access a public path (like /sign-in or /signup),
  // redirect them to the home page (/) only if they are not already on it.
  if (isPublicPath && token && path !== '/') {
    return NextResponse.redirect(new URL('/', request.nextUrl))
  }

  // If the user is not logged in (no token) and trying to access a restricted path (not a public path),
  // redirect them to /sign-in unless they are already on the sign-in page.
  if (!isPublicPath && !token && path !== '/sign-in') {
    return NextResponse.redirect(new URL('/sign-in', request.nextUrl))
  }

  // Allow the request to continue if none of the conditions matched
  return NextResponse.next()
}

// Config to match specific paths for the middleware
export const config = {
  matcher: [
    '/',
    '/sign-in',
    '/signup',
    '/verify',
    '/dashboard',    // Example of private route
    '/profile',      // Example of private route
    // Add other private paths here
  ]
}
