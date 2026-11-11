export type AppEnv = 'development' | 'production' | 'test';

export const appEnv = (process.env.APP_ENV ||
  process.env.NODE_ENV ||
  'production') as AppEnv;

export const isDevelopment = appEnv === 'development';

/** CORS is enabled automatically in development unless explicitly disabled. */
export const isCorsEnabled =
  isDevelopment && process.env.CORS_ENABLED !== 'false';

export function getSiteUrl(): string {
  return process.env.AUTH_URL || 'http://localhost:3000';
}

export function getCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN;
  if (raw) {
    return raw.split(',').map((origin) => origin.trim()).filter(Boolean);
  }
  return ['http://localhost:3000', 'http://127.0.0.1:3000'];
}
