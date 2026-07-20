import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { SessionUser } from '@/types';
import { applyCorsHeaders } from '@/lib/cors';
import { isCorsEnabled } from '@/lib/env';
import { ModuleAccessError } from '@/lib/module-access';

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as SessionUser;
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new AuthError('Unauthorized', 401);
  }
  return user;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

function withOptionalCors(
  request: NextRequest | undefined,
  response: NextResponse
): NextResponse {
  if (isCorsEnabled && request) {
    return applyCorsHeaders(response, request);
  }
  return response;
}

export function apiError(message: string, status: number, request?: NextRequest) {
  return withOptionalCors(
    request,
    NextResponse.json({ error: message }, { status })
  );
}

export function apiSuccess<T>(data: T, status = 200, request?: NextRequest) {
  return withOptionalCors(request, NextResponse.json(data, { status }));
}

export function handleApiError(error: unknown, request?: NextRequest) {
  if (error instanceof AuthError) return apiError(error.message, error.status, request);
  if (error instanceof ModuleAccessError) return apiError('You do not have access to this section', 403, request);
  return apiError('Internal server error', 500, request);
}
