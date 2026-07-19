import 'server-only';

import { encryptField, decryptField } from './encryption';
import { toPlainObject } from './plain-object';
import { MASK_PLACEHOLDER } from './credentials-display';

export { MASK_PLACEHOLDER };

const CREDENTIAL_SENSITIVE_FIELDS = ['password', 'panId', 'tanId', 'userId'];
const BANK_SENSITIVE_FIELDS = ['loginPassword', 'transactionPassword'];

export function encryptCredentials(data: Record<string, unknown>): Record<string, unknown> {
  return encryptFields(data, CREDENTIAL_SENSITIVE_FIELDS);
}

export function decryptCredentials(data: Record<string, unknown>): Record<string, unknown> {
  return decryptFields(data, CREDENTIAL_SENSITIVE_FIELDS);
}

export function maskCredentials(data: Record<string, unknown>): Record<string, unknown> {
  return maskFields(data, CREDENTIAL_SENSITIVE_FIELDS);
}

export function encryptBankOperation(data: Record<string, unknown>): Record<string, unknown> {
  return encryptFields(data, BANK_SENSITIVE_FIELDS);
}

export function decryptBankOperation(data: Record<string, unknown>): Record<string, unknown> {
  return decryptFields(data, BANK_SENSITIVE_FIELDS);
}

export function maskBankOperation(data: Record<string, unknown>): Record<string, unknown> {
  return maskFields(data, BANK_SENSITIVE_FIELDS);
}

function encryptFields(
  data: Record<string, unknown>,
  fields: string[]
): Record<string, unknown> {
  const result = { ...toPlainObject(data) };
  for (const field of fields) {
    if (typeof result[field] === 'string' && result[field]) {
      result[field] = encryptField(result[field] as string);
    }
  }
  return result;
}

function decryptFields(
  data: Record<string, unknown>,
  fields: string[]
): Record<string, unknown> {
  const result = { ...toPlainObject(data) };
  for (const field of fields) {
    if (typeof result[field] === 'string' && result[field]) {
      result[field] = decryptField(result[field] as string);
    }
  }
  return result;
}

function maskFields(data: Record<string, unknown>, fields: string[]): Record<string, unknown> {
  const result = { ...toPlainObject(data) };
  for (const field of fields) {
    if (typeof result[field] === 'string' && result[field]) {
      result[field] = MASK_PLACEHOLDER;
    }
  }
  return result;
}

/** Skip masked placeholders when updating so existing secrets are preserved. */
export function mergeCredentialUpdate(
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
  sensitiveFields: string[]
): Record<string, unknown> {
  const plainExisting = toPlainObject(existing);
  const plainIncoming = toPlainObject(incoming);
  const merged = { ...plainExisting, ...plainIncoming };
  for (const field of sensitiveFields) {
    const value = plainIncoming[field];
    if (
      value === undefined ||
      value === null ||
      value === '' ||
      value === MASK_PLACEHOLDER
    ) {
      merged[field] = plainExisting[field];
    }
  }
  return merged;
}
