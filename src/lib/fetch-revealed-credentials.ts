'use client';

import { normalizeSectionData, MASK_PLACEHOLDER } from '@/lib/credentials-display';

export async function fetchRevealedCredentialSections(
  companyId: string,
  apiPath: string
): Promise<Record<string, Record<string, string>> | undefined> {
  try {
    const res = await fetch(
      `/api/companies/${companyId}/${apiPath}?reveal=true`,
      { credentials: 'same-origin', cache: 'no-store' }
    );
    if (!res.ok) return undefined;
    const json = await res.json();
    if (!json || typeof json !== 'object' || Array.isArray(json)) return undefined;
    return normalizeSectionData(json as Record<string, unknown>);
  } catch {
    return undefined;
  }
}

export function pickCredentialField(
  sections: Record<string, Record<string, string>> | undefined,
  sectionKey: string,
  fieldName: string
): string | undefined {
  const value = sections?.[sectionKey]?.[fieldName];
  if (!value || value === MASK_PLACEHOLDER) return undefined;
  return value;
}

export async function fetchRevealedBankEntries<T extends { _id: string }>(
  companyId: string
): Promise<T[] | undefined> {
  try {
    const res = await fetch(
      `/api/companies/${companyId}/bank-operations?reveal=true`,
      { credentials: 'same-origin', cache: 'no-store' }
    );
    if (!res.ok) return undefined;
    const json = await res.json();
    if (!Array.isArray(json)) return undefined;
    return json as T[];
  } catch {
    return undefined;
  }
}

export function pickBankField<T extends { _id: string }>(
  entries: T[] | undefined,
  entryId: string,
  fieldName: keyof T & string
): string | undefined {
  const entry = entries?.find((e) => e._id === entryId);
  const value = entry?.[fieldName];
  if (typeof value !== 'string' || !value || value === MASK_PLACEHOLDER) return undefined;
  return value;
}
