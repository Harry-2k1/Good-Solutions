import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { requireAuth, apiError, apiSuccess, AuthError } from '@/lib/api-utils';
import { User } from '@/models/User';
import { changePasswordSchema } from '@/lib/validation';

export async function PATCH(request: Request) {
  try {
    const sessionUser = await requireAuth();
    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    const { currentPassword, newPassword } = parsed.data;

    if (currentPassword === newPassword) {
      return apiError('New password must be different from current password', 400);
    }

    await connectDB();
    const user = await User.findById(sessionUser.id).select('+password');

    if (!user || !user.isActive) {
      return apiError('User not found', 404);
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return apiError('Current password is incorrect', 400);
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return apiSuccess({ message: 'Password updated successfully' });
  } catch (error) {
    if (error instanceof AuthError) return apiError(error.message, error.status);
    return apiError('Internal server error', 500);
  }
}
