import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { requireAuth, apiError, apiSuccess, AuthError } from '@/lib/api-utils';
import { User } from '@/models/User';
import { canResetUserPassword } from '@/lib/permissions';
import { resetPasswordSchema } from '@/lib/validation';
import { UserRole } from '@/types';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await requireAuth();
    const { id } = await params;
    const isSelf = id === sessionUser.id;

    if (isSelf && sessionUser.role !== UserRole.SUPER_ADMIN) {
      return apiError('Use Change Password to update your own password', 400);
    }

    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    await connectDB();
    const user = await User.findOne({
      _id: id,
      organizationId: sessionUser.organizationId,
      isActive: true,
    }).select('+password');

    if (!user) return apiError('User not found', 404);

    if (!canResetUserPassword(sessionUser.role, user.role, isSelf)) {
      return apiError('Forbidden', 403);
    }

    user.password = await bcrypt.hash(parsed.data.newPassword, 12);
    await user.save();

    return apiSuccess({ message: 'Password updated successfully' });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    return apiError('Internal server error', 500);
  }
}
