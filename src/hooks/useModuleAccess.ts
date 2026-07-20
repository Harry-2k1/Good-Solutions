'use client';

import { useSession } from 'next-auth/react';
import { AccountantModule, SessionUser, UserRole } from '@/types';
import {
  getAccessibleModules,
  hasFullModuleAccess,
  hasModuleAccess,
} from '@/lib/module-access';

export function useModuleAccess() {
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  return {
    user,
    hasAccess: (module: AccountantModule) =>
      user ? hasModuleAccess(user, module) : false,
    accessibleModules: user ? getAccessibleModules(user) : [],
    canManageModules:
      user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN,
    isManager: user ? hasFullModuleAccess(user.role) : false,
  };
}
