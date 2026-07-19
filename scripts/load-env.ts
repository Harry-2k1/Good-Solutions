import { loadEnvConfig } from '@next/env';

/**
 * Load .env, .env.local, and mode-specific env files (same order as Next.js).
 * Use in standalone scripts (seed, migrations) that run outside `next dev/build`.
 */
loadEnvConfig(process.cwd());
