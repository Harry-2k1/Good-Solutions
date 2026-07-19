import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAuth, apiError, apiSuccess, AuthError } from '@/lib/api-utils';
import { Company } from '@/models/Company';
import { companyLoginDetailSchema } from '@/lib/validation';
import { findSubdocumentById, removeSubdocumentById, toPlainArray } from '@/lib/mongoose-utils';

async function getCompany(id: string, organizationId: string) {
  await connectDB();
  return Company.findOne({ _id: id, organizationId, isActive: true });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await requireAuth();
    const { id } = await params;

    await connectDB();
    const company = await Company.findOne({ _id: id, organizationId: sessionUser.organizationId, isActive: true }).lean();
    if (!company) return apiError('Company not found', 404);

    return apiSuccess(toPlainArray(company.companyLoginDetails));
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
    const parsed = companyLoginDetailSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    const company = await getCompany(id, sessionUser.organizationId);
    if (!company) return apiError('Company not found', 404);

    company.companyLoginDetails.push(parsed.data);
    await company.save();

    return apiSuccess(company.companyLoginDetails[company.companyLoginDetails.length - 1], 201);
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

    const entry = findSubdocumentById(company.companyLoginDetails, entryId);
    if (!entry) return apiError('Login detail not found', 404);

    if (data.portalName) entry.portalName = data.portalName;
    if (data.links !== undefined) entry.links = data.links;
    if (data.description !== undefined) entry.description = data.description;

    await company.save();
    return apiSuccess(entry);
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

    const entry = findSubdocumentById(company.companyLoginDetails, entryId);
    if (!entry) return apiError('Login detail not found', 404);

    company.companyLoginDetails = removeSubdocumentById(company.companyLoginDetails, entryId);
    await company.save();

    return apiSuccess({ message: 'Login detail deleted' });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    return apiError('Internal server error', 500);
  }
}
