import { NextRequest, NextResponse } from 'next/server';
import { getCorsOrigins, isCorsEnabled } from '@/lib/env';

const CORS_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
const CORS_HEADERS = 'Content-Type, Authorization, X-Requested-With';

function resolveAllowedOrigin(request: NextRequest): string | null {
  const origin = request.headers.get('origin');
  if (!origin) return getCorsOrigins()[0] ?? null;

  const allowed = getCorsOrigins();
  if (allowed.includes('*')) return origin;
  if (allowed.includes(origin)) return origin;

  return null;
}

export function applyCorsHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  if (!isCorsEnabled) return response;

  const origin = resolveAllowedOrigin(request);
  if (!origin) return response;

  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', CORS_METHODS);
  response.headers.set('Access-Control-Allow-Headers', CORS_HEADERS);
  response.headers.set('Vary', 'Origin');

  return response;
}

export function corsPreflightResponse(request: NextRequest): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  return applyCorsHeaders(response, request);
}

export function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api');
}

export function withCorsJson(
  request: NextRequest,
  body: unknown,
  status: number
): NextResponse {
  const response = NextResponse.json(body, { status });
  return applyCorsHeaders(response, request);
}
