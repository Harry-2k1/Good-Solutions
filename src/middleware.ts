import NextAuth from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authConfig } from '@/lib/auth.config';
import { isCorsEnabled } from '@/lib/env';
import {
  applyCorsHeaders,
  corsPreflightResponse,
  isApiRoute,
  withCorsJson,
} from '@/lib/cors';

const { auth } = NextAuth(authConfig);

const publicRoutes = ['/login'];
const authRoutes = ['/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isCorsEnabled && isApiRoute(pathname) && request.method === 'OPTIONS') {
    return corsPreflightResponse(request);
  }

  const session = await auth();

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isApiAuth = pathname.startsWith('/api/auth');

  if (isApiAuth) {
    return applyCorsHeaders(NextResponse.next(), request);
  }

  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (!session && !isPublicRoute && !pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (!session && isApiRoute(pathname) && !pathname.startsWith('/api/auth')) {
    return withCorsJson(request, { error: 'Unauthorized' }, 401);
  }

  if (isCorsEnabled && isApiRoute(pathname)) {
    return applyCorsHeaders(NextResponse.next(), request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
