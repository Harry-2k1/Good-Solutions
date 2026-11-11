import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { apiError, apiSuccess, handleApiError } from '@/lib/api-utils';
import { getSuperAdminEmail, getSuperAdminEnvPassword } from '@/lib/app-env';
import { overrideSuperAdminPasswordSchema } from '@/lib/validation';
import { User } from '@/models/User';
import { UserRole } from '@/types';

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const parsed = overrideSuperAdminPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    const nextPassword = parsed.data.useEnvPassword
      ? getSuperAdminEnvPassword()
      : parsed.data.newPassword;

    if (!nextPassword) {
      return apiError(
        parsed.data.useEnvPassword
          ? 'SUPER_ADMIN_PASSWORD is not set in the environment'
          : 'New password is required',
        400
      );
    }

    if (nextPassword.length < 8) {
      return apiError('Password must be at least 8 characters', 400);
    }

    await connectDB();
    const email = getSuperAdminEmail();
    const superAdmin =
      (await User.findOne({
        email,
        role: UserRole.SUPER_ADMIN,
      }).select('+password')) ??
      (await User.findOne({
        role: UserRole.SUPER_ADMIN,
      }).select('+password'));

    if (!superAdmin) {
      return apiError('Super admin user not found', 404);
    }

    superAdmin.password = await bcrypt.hash(nextPassword, 12);
    superAdmin.isActive = true;
    await superAdmin.save();

    return apiSuccess({
      message: parsed.data.useEnvPassword
        ? 'Super admin password reset from SUPER_ADMIN_PASSWORD'
        : 'Super admin password updated',
      email: superAdmin.email,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
