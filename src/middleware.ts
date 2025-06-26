import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'pocketmarks_session';

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  const { pathname } = request.nextUrl;

  const isProtected = pathname.startsWith('/bookmarks');
  const isLoginPage = pathname === '/login';

  if (isProtected && !sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isLoginPage && sessionCookie) {
    return NextResponse.redirect(new URL('/bookmarks', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/bookmarks/:path*', '/login'],
};
