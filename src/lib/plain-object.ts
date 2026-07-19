/** Plain-object helpers safe for client and server (no Node/Mongoose imports). */

export function toPlainObject(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) return {};
  if (typeof value !== 'object' || Array.isArray(value)) return {};

  const obj = value as Record<string, unknown> & {
    toObject?: (options?: { flattenMaps?: boolean }) => Record<string, unknown>;
    toJSON?: () => Record<string, unknown>;
  };

  if (typeof obj.toObject === 'function') {
    return obj.toObject({ flattenMaps: true });
  }
  if (typeof obj.toJSON === 'function') {
    return obj.toJSON();
  }

  try {
    return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  } catch {
    return { ...obj };
  }
}

export function toPlainArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => toPlainObject(item));
}
