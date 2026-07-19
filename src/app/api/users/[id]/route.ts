import { connectDB } from '@/lib/db';
import { requireAuth, apiError, apiSuccess, AuthError } from '@/lib/api-utils';
import { User } from '@/models/User';
import { canViewUsers } from '@/lib/permissions';
import { UserRole } from '@/types';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await requireAuth();
    const { id } = await params;

    if (!canViewUsers(sessionUser.role)) {
      return apiError('Forbidden', 403);
    }

    await connectDB();
    const user = await User.findOne({
      _id: id,
      organizationId: sessionUser.organizationId,
      ...(sessionUser.role === UserRole.ADMIN ? { role: UserRole.USER } : {}),
    })
      .select('-password')
      .lean();

    if (!user) return apiError('User not found', 404);
    return apiSuccess(user);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    return apiError('Internal server error', 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await requireAuth();
    const { id } = await params;

    if (!canViewUsers(sessionUser.role)) {
      return apiError('Forbidden', 403);
    }

    const body = await request.json();
    await connectDB();

    const user = await User.findOne({
      _id: id,
      organizationId: sessionUser.organizationId,
    });

    if (!user) return apiError('User not found', 404);

    if (sessionUser.role === UserRole.ADMIN && user.role !== UserRole.USER) {
      return apiError('Forbidden', 403);
    }

    if (body.name) user.name = body.name;
    if (typeof body.isActive === 'boolean') user.isActive = body.isActive;

    await user.save();
    const { password: _, ...result } = user.toObject() as unknown as Record<string, unknown>;

    return apiSuccess(result);
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    return apiError('Internal server error', 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await requireAuth();
    const { id } = await params;

    if (!canViewUsers(sessionUser.role)) {
      return apiError('Forbidden', 403);
    }

    if (id === sessionUser.id) {
      return apiError('Cannot deactivate your own account', 400);
    }

    await connectDB();
    const user = await User.findOne({
      _id: id,
      organizationId: sessionUser.organizationId,
    });

    if (!user) return apiError('User not found', 404);
    if (user.role === UserRole.SUPER_ADMIN) {
      return apiError('Cannot deactivate super admin', 403);
    }

    user.isActive = false;
    await user.save();

    return apiSuccess({ message: 'User deactivated' });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    return apiError('Internal server error', 500);
  }
}
