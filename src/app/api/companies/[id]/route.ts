import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAuth, apiError, apiSuccess, AuthError } from '@/lib/api-utils';
import { Company } from '@/models/Company';
import { createCompanySchema } from '@/lib/validation';
import { decryptCredentials, encryptCredentials, maskCredentials, maskBankOperation, decryptBankOperation } from '@/lib/credentials';

function sanitizeCompany(company: object, revealSecrets = false) {
  const result = JSON.parse(JSON.stringify(company)) as Record<string, unknown>;
  const processCreds = (obj: Record<string, unknown>) =>
    revealSecrets ? decryptCredentials(obj) : maskCredentials(obj);

  if (result.gst) {
    const gst = result.gst as Record<string, Record<string, unknown>>;
    for (const key of Object.keys(gst)) {
      gst[key] = processCreds(gst[key] || {});
    }
    result.gst = gst;
  }
  if (result.incomeTax) {
    const incomeTax = result.incomeTax as Record<string, Record<string, unknown>>;
    for (const key of Object.keys(incomeTax)) {
      incomeTax[key] = processCreds(incomeTax[key] || {});
    }
    result.incomeTax = incomeTax;
  }
  if (result.bankOperations) {
    result.bankOperations = (result.bankOperations as Record<string, unknown>[]).map((b) =>
      revealSecrets ? decryptBankOperation(b) : maskBankOperation(b)
    );
  }
  return result;
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

    const company = await getCompany(id, sessionUser.organizationId);
    if (!company) return apiError('Company not found', 404);

    const populated = await company.populate([
      { path: 'tasks.assignedTo', select: 'name email' },
      { path: 'tasks.createdBy', select: 'name email' },
      { path: 'gst.loginDetails.updatedBy', select: 'name email' },
    ]);

    return apiSuccess(
      sanitizeCompany(populated.toObject(), reveal)
    );
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

    const company = await getCompany(id, sessionUser.organizationId);
    if (!company) return apiError('Company not found', 404);

    if (body.name) company.name = body.name;
    if (body.description !== undefined) company.description = body.description;
    if (body.companyType) company.companyType = body.companyType;
    if (body.contacts) company.contacts = body.contacts;
    if (body.links) company.links = body.links;

    await company.save();
    return apiSuccess(sanitizeCompany(company.toObject()));
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    return apiError('Internal server error', 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await requireAuth();
    const { id } = await params;

    const company = await getCompany(id, sessionUser.organizationId);
    if (!company) return apiError('Company not found', 404);

    company.isActive = false;
    await company.save();

    return apiSuccess({ message: 'Company deactivated' });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    return apiError('Internal server error', 500);
  }
}

export { encryptCredentials, decryptCredentials, sanitizeCompany };
