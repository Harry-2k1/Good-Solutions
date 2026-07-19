import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAuth, apiError, apiSuccess, AuthError } from '@/lib/api-utils';
import { Company } from '@/models/Company';
import { createCompanySchema } from '@/lib/validation';
import { decryptCredentials, maskCredentials } from '@/lib/credentials';

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
      processCreds(b)
    );
  }

  return result;
}

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await requireAuth();
    const reveal = request.nextUrl.searchParams.get('reveal') === 'true';

    await connectDB();
    const companies = await Company.find({
      organizationId: sessionUser.organizationId,
      isActive: true,
    })
      .sort({ name: 1 })
      .lean();

    return apiSuccess(companies.map((c) => sanitizeCompany(c, reveal)));
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    return apiError('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await requireAuth();
    const body = await request.json();
    const parsed = createCompanySchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    await connectDB();
    const company = await Company.create({
      ...parsed.data,
      organizationId: sessionUser.organizationId,
      createdBy: sessionUser.id,
    });

    return apiSuccess(sanitizeCompany(company.toObject()), 201);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    return apiError('Internal server error', 500);
  }
}
