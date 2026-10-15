import { NextRequest, NextResponse } from 'next/server';
import { authCookieName, authToken } from './src/lib/auth';

const publicPaths = ['/login', '/api/auth/login', '/api/auth/logout'];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isPublic = publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isAuthenticated = request.cookies.get(authCookieName)?.value === authToken();

  if (isPublic) {
    if (pathname === '/login' && isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo-ronaldo-gazolla-crop.png).*)'],
};
