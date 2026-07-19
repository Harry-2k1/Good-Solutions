import 'server-only';

import { Types } from 'mongoose';
import { toPlainObject, toPlainArray } from '@/lib/plain-object';

export { toPlainObject, toPlainArray };

interface WithId {
  _id?: Types.ObjectId | string;
  toObject?: () => Record<string, unknown>;
}

export function findSubdocumentById<T extends WithId>(
  array: T[],
  id: string
): T | undefined {
  return array.find((item) => item._id?.toString() === id);
}

export function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

export function removeSubdocumentById<T extends WithId>(array: T[], id: string): T[] {
  return array.filter((item) => item._id?.toString() !== id);
}
