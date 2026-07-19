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
import {
  checkRateLimit,
  getClientIp,
  getRateLimitConfig,
  rateLimitHeaders,
} from '@/lib/rate-limit';

const { auth } = NextAuth(authConfig);

const publicRoutes = ['/login'];
const authRoutes = ['/login'];

function rateLimitedResponse(request: NextRequest, resetAt: number) {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  const response = withCorsJson(
    request,
    { error: 'Too many requests. Please try again later.' },
    429
  );
  response.headers.set('Retry-After', String(retryAfter));
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isCorsEnabled && isApiRoute(pathname) && request.method === 'OPTIONS') {
    return corsPreflightResponse(request);
  }

  if (isApiRoute(pathname)) {
    const isAuthApi = pathname.startsWith('/api/auth');
    const ip = getClientIp(request);
    const config = getRateLimitConfig(isAuthApi);
    const result = checkRateLimit(`${ip}:${isAuthApi ? 'auth' : 'api'}`, config);

    if (!result.success) {
      const blocked = rateLimitedResponse(request, result.resetAt);
      Object.entries(rateLimitHeaders(result)).forEach(([k, v]) => {
        blocked.headers.set(k, v);
      });
      return blocked;
    }
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
