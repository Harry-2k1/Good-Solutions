import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAuth, apiError, apiSuccess, AuthError } from '@/lib/api-utils';
import { Company } from '@/models/Company';
import { bankOperationSchema } from '@/lib/validation';
import { encryptBankOperation, decryptBankOperation, maskBankOperation, mergeCredentialUpdate } from '@/lib/credentials';
import { findSubdocumentById, removeSubdocumentById, toPlainObject, toPlainArray } from '@/lib/mongoose-utils';

const BANK_SENSITIVE = ['loginPassword', 'transactionPassword'];

async function getCompanyLean(id: string, organizationId: string) {
  await connectDB();
  return Company.findOne({ _id: id, organizationId, isActive: true }).lean();
}

async function getCompany(id: string, organizationId: string) {
  await connectDB();
  return Company.findOne({ _id: id, organizationId, isActive: true });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await requireAuth();
    const { id } = await params;
    const reveal = request.nextUrl.searchParams.get('reveal') === 'true';

    const company = await getCompanyLean(id, sessionUser.organizationId);
    if (!company) return apiError('Company not found', 404);

    const ops = toPlainArray(company.bankOperations).map((obj) =>
      reveal ? decryptBankOperation(obj) : maskBankOperation(obj)
    );

    return apiSuccess(ops);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    return apiError('Internal server error', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const parsed = bankOperationSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    const company = await getCompany(id, sessionUser.organizationId);
    if (!company) return apiError('Company not found', 404);

    company.bankOperations.push(encryptBankOperation(parsed.data as Record<string, unknown>));
    await company.save();

    const last = company.bankOperations[company.bankOperations.length - 1];
    return apiSuccess(maskBankOperation(decryptBankOperation(last as Record<string, unknown>)), 201);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    return apiError('Internal server error', 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { entryId, ...data } = body;

    if (!entryId) return apiError('Entry ID is required', 400);

    const company = await getCompany(id, sessionUser.organizationId);
    if (!company) return apiError('Company not found', 404);

    const entry = findSubdocumentById(company.bankOperations, entryId);
    if (!entry) return apiError('Bank operation not found', 404);

    const existing = decryptBankOperation(entry as Record<string, unknown>);
    const merged = mergeCredentialUpdate(existing, data, BANK_SENSITIVE);
    const encrypted = encryptBankOperation(merged);
    Object.assign(entry, encrypted);
    await company.save();

    return apiSuccess(
      maskBankOperation(decryptBankOperation(toPlainObject(entry)))
    );
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    return apiError('Internal server error', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await requireAuth();
    const { id } = await params;
    const entryId = request.nextUrl.searchParams.get('entryId');

    if (!entryId) return apiError('Entry ID is required', 400);

    const company = await getCompany(id, sessionUser.organizationId);
    if (!company) return apiError('Company not found', 404);

    const entry = findSubdocumentById(company.bankOperations, entryId);
    if (!entry) return apiError('Bank operation not found', 404);

    company.bankOperations = removeSubdocumentById(company.bankOperations, entryId);
    await company.save();

    return apiSuccess({ message: 'Bank operation deleted' });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    return apiError('Internal server error', 500);
  }
}
