import { getMongoStatus } from '@/lib/db';
import { apiSuccess, handleApiError } from '@/lib/api-utils';
import { getSuperAdminEmail, readAppEnvValues } from '@/lib/app-env';
import { User } from '@/models/User';
import { UserRole } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const mongodb = await getMongoStatus();
    let superAdmin: {
      _id: string;
      name: string;
      email: string;
      isActive: boolean;
    } | null = null;

    if (mongodb.connected) {
      const email = getSuperAdminEmail();
      const found =
        (await User.findOne({ email, role: UserRole.SUPER_ADMIN })
          .select('name email isActive')
          .lean()) ??
        (await User.findOne({ role: UserRole.SUPER_ADMIN })
          .select('name email isActive')
          .lean());

      if (found) {
        superAdmin = {
          _id: String(found._id),
          name: found.name,
          email: found.email,
          isActive: found.isActive,
        };
      }
    }

    return apiSuccess({
      variables: readAppEnvValues(),
      mongodb,
      superAdmin,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
