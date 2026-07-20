import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAuth, apiError, apiSuccess, handleApiError } from '@/lib/api-utils';
import { Company } from '@/models/Company';
import { encryptCredentials, decryptCredentials, maskCredentials, mergeCredentialUpdate } from '@/lib/credentials';
import { toPlainObject } from '@/lib/mongoose-utils';
import { requireModuleAccess } from '@/lib/module-access';
import { AccountantModule } from '@/types';

const CREDENTIAL_SENSITIVE = ['password', 'panId', 'tanId', 'userId'];

const IT_SECTIONS = ['itFiling', 'tdsPayment', 'tdsTracers', 'bulkDownload'] as const;

async function getCompany(id: string, organizationId: string) {
  await connectDB();
  return Company.findOne({ _id: id, organizationId, isActive: true });
}

async function getCompanyLean(id: string, organizationId: string) {
  await connectDB();
  return Company.findOne({ _id: id, organizationId, isActive: true }).lean();
}

function sanitizeIncomeTax(incomeTax: unknown, reveal: boolean) {
  const taxPlain = toPlainObject(incomeTax);
  const result: Record<string, Record<string, unknown>> = {};
  for (const section of IT_SECTIONS) {
    const sectionData = toPlainObject(taxPlain[section]);
    result[section] = reveal
      ? decryptCredentials(sectionData)
      : maskCredentials(sectionData);
  }
  return result;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await requireAuth();
    requireModuleAccess(sessionUser, AccountantModule.INCOME_TAX);
    const { id } = await params;
    const reveal = request.nextUrl.searchParams.get('reveal') === 'true';

    const company = await getCompanyLean(id, sessionUser.organizationId);
    if (!company) return apiError('Company not found', 404);

    return apiSuccess(sanitizeIncomeTax(company.incomeTax, reveal));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await requireAuth();
    requireModuleAccess(sessionUser, AccountantModule.INCOME_TAX);
    const { id } = await params;
    const body = await request.json();
    const { section, data } = body;

    if (!section || !IT_SECTIONS.includes(section)) {
      return apiError('Invalid Income Tax section', 400);
    }

    const sectionKey = section as (typeof IT_SECTIONS)[number];

    const company = await getCompany(id, sessionUser.organizationId);
    if (!company) return apiError('Company not found', 404);

    const existing = decryptCredentials(
      (company.incomeTax[sectionKey] || {}) as Record<string, unknown>
    );
    const merged = mergeCredentialUpdate(existing, data, CREDENTIAL_SENSITIVE);
    const encrypted = encryptCredentials(merged);
    company.incomeTax[sectionKey] = encrypted;
    company.markModified(`incomeTax.${sectionKey}`);
    await company.save();

    return apiSuccess(
      maskCredentials(
        decryptCredentials(toPlainObject(company.incomeTax[sectionKey]))
      )
    );
  } catch (error) {
    return handleApiError(error);
  }
}
