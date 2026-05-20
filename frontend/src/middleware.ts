import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/auth/callback'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // The actual auth check happens client-side (token is in memory).
  // This middleware is a lightweight guard for SSR — it checks for
  // the refresh_token cookie as a signal that the user has been authenticated.
  // If no cookie, redirect to login.
  const hasRefreshToken = request.cookies.has('refresh_token');

  if (!hasRefreshToken) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
