import { toPlainObject } from '@/lib/plain-object';

export const MASK_PLACEHOLDER = '********';

export function hasConfiguredData(
  data: Record<string, unknown> | undefined,
  ignoreKeys: string[] = ['updatedBy', '_id', '__v']
): boolean {
  const plain = toPlainObject(data);
  return Object.entries(plain).some(([key, value]) => {
    if (ignoreKeys.includes(key)) return false;
    if (value === null || value === undefined || value === '') return false;
    if (typeof value === 'object') return false;
    return true;
  });
}

export function normalizeSectionData(
  sections: Record<string, unknown>
): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  for (const [sectionKey, sectionVal] of Object.entries(sections)) {
    const plain = toPlainObject(sectionVal);
    const section: Record<string, string> = {};
    for (const [k, v] of Object.entries(plain)) {
      if (v === null || v === undefined) continue;
      if (typeof v === 'object') {
        if (v instanceof Date) {
          section[k] = v.toISOString();
        }
        continue;
      }
      section[k] = String(v);
    }
    result[sectionKey] = section;
  }
  return result;
}

export function formatDisplayDate(value: unknown): string {
  if (!value) return '—';
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
