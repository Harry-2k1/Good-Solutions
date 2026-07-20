import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAuth, apiError, apiSuccess, AuthError } from '@/lib/api-utils';
import { User } from '@/models/User';
import { canViewUsers, canCreateRole } from '@/lib/permissions';
import { createUserSchema } from '@/lib/validation';
import bcrypt from 'bcryptjs';
import { UserRole } from '@/types';

export async function GET() {
  try {
    const sessionUser = await requireAuth();
    if (!canViewUsers(sessionUser.role)) {
      return apiError('Forbidden', 403);
    }

    await connectDB();
    const query =
      sessionUser.role === UserRole.SUPER_ADMIN
        ? { organizationId: sessionUser.organizationId }
        : { organizationId: sessionUser.organizationId, role: UserRole.USER };

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    return apiSuccess(users);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    return apiError('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await requireAuth();
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    if (!canCreateRole(sessionUser.role, parsed.data.role)) {
      return apiError('You cannot create users with this role', 403);
    }

    await connectDB();

    const existing = await User.findOne({ email: parsed.data.email });
    if (existing) {
      return apiError('Email already in use', 409);
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

    const user = await User.create({
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashedPassword,
      role: parsed.data.role,
      organizationId: sessionUser.organizationId,
      createdBy: sessionUser.id,
      moduleAccess:
        parsed.data.role === UserRole.USER ? (parsed.data.moduleAccess ?? []) : [],
    });

    const { password: _, ...result } = user.toObject() as unknown as Record<string, unknown>;

    return apiSuccess(result, 201);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    return apiError('Internal server error', 500);
  }
}
