export type EnvGroup =
  | 'Database'
  | 'Authentication'
  | 'Encryption'
  | 'Super Admin'
  | 'App'
  | 'CORS'
  | 'Rate limiting';

export interface EnvVarDef {
  key: string;
  group: EnvGroup;
  sensitive: boolean;
  description: string;
}

export interface EnvVarValue extends EnvVarDef {
  value: string | null;
  isSet: boolean;
}

export const APP_ENV_VARS: EnvVarDef[] = [
  {
    key: 'MONGODB_URI',
    group: 'Database',
    sensitive: true,
    description: 'MongoDB connection string',
  },
  {
    key: 'AUTH_SECRET',
    group: 'Authentication',
    sensitive: true,
    description: 'NextAuth secret (min 32 characters)',
  },
  {
    key: 'AUTH_URL',
    group: 'Authentication',
    sensitive: false,
    description: 'Public app URL (production). Omit in local dev.',
  },
  {
    key: 'AUTH_TRUST_HOST',
    group: 'Authentication',
    sensitive: false,
    description: 'Trust the request host for Auth.js in local/dev',
  },
  {
    key: 'ENCRYPTION_KEY',
    group: 'Encryption',
    sensitive: true,
    description: 'Field-level encryption key (min 32 characters)',
  },
  {
    key: 'SUPER_ADMIN_EMAIL',
    group: 'Super Admin',
    sensitive: false,
    description: 'Seeded super admin email',
  },
  {
    key: 'SUPER_ADMIN_PASSWORD',
    group: 'Super Admin',
    sensitive: true,
    description: 'Seeded super admin password',
  },
  {
    key: 'SUPER_ADMIN_NAME',
    group: 'Super Admin',
    sensitive: false,
    description: 'Seeded super admin display name',
  },
  {
    key: 'SUPER_ADMIN_RESET_PASSWORD',
    group: 'Super Admin',
    sensitive: false,
    description: 'When true, seed script resets the super admin password',
  },
  {
    key: 'APP_ENV',
    group: 'App',
    sensitive: false,
    description: 'Application environment (development | production | test)',
  },
  {
    key: 'NODE_ENV',
    group: 'App',
    sensitive: false,
    description: 'Node runtime environment',
  },
  {
    key: 'CORS_ENABLED',
    group: 'CORS',
    sensitive: false,
    description: 'Enable CORS (auto-on in development unless false)',
  },
  {
    key: 'CORS_ORIGIN',
    group: 'CORS',
    sensitive: false,
    description: 'Allowed CORS origins (comma-separated)',
  },
  {
    key: 'RATE_LIMIT_ENABLED',
    group: 'Rate limiting',
    sensitive: false,
    description: 'Enable API rate limiting',
  },
  {
    key: 'RATE_LIMIT_MAX',
    group: 'Rate limiting',
    sensitive: false,
    description: 'Max API requests per window',
  },
  {
    key: 'RATE_LIMIT_WINDOW_MS',
    group: 'Rate limiting',
    sensitive: false,
    description: 'Rate limit window in milliseconds',
  },
  {
    key: 'AUTH_RATE_LIMIT_MAX',
    group: 'Rate limiting',
    sensitive: false,
    description: 'Max auth requests per window',
  },
];

export const DEFAULT_SUPER_ADMIN_EMAIL = 'admin@goodsolutions.com';

export function readAppEnvValues(): EnvVarValue[] {
  return APP_ENV_VARS.map((def) => {
    const raw = process.env[def.key];
    const isSet = raw !== undefined && raw !== '';
    return {
      ...def,
      value: isSet ? raw : null,
      isSet,
    };
  });
}

export function getSuperAdminEmail(): string {
  return process.env.SUPER_ADMIN_EMAIL || DEFAULT_SUPER_ADMIN_EMAIL;
}

export function getSuperAdminEnvPassword(): string | null {
  const password = process.env.SUPER_ADMIN_PASSWORD;
  return password ? password : null;
}
