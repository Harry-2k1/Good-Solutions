/**
 * In-memory sliding-window rate limiter (Edge-compatible).
 * For multi-instance production (Vercel), consider Upstash Redis.
 */

export interface RateLimitConfig {
  max: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, bucket] of store.entries()) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      success: true,
      limit: config.max,
      remaining: config.max - 1,
      resetAt,
    };
  }

  if (bucket.count >= config.max) {
    return {
      success: false,
      limit: config.max,
      remaining: 0,
      resetAt: bucket.resetAt,
    };
  }

  bucket.count += 1;
  store.set(key, bucket);

  return {
    success: true,
    limit: config.max,
    remaining: config.max - bucket.count,
    resetAt: bucket.resetAt,
  };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return request.headers.get('x-real-ip') || 'unknown';
}

/** High-frequency, low-risk Auth.js reads should not share the login rate bucket. */
export function isStrictAuthRateLimitPath(pathname: string, method: string): boolean {
  if (!pathname.startsWith('/api/auth')) return false;

  const safeGetPaths = ['/api/auth/session', '/api/auth/csrf', '/api/auth/providers'];
  if (method === 'GET' && safeGetPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return false;
  }

  return true;
}

export function getRateLimitConfig(isAuthRoute: boolean): RateLimitConfig {
  const enabled = process.env.RATE_LIMIT_ENABLED !== 'false';
  if (!enabled) {
    return { max: Number.MAX_SAFE_INTEGER, windowMs: 60_000 };
  }

  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);

  if (isAuthRoute) {
    return {
      max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '60', 10),
      windowMs,
    };
  }

  return {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    windowMs,
  };
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
}
