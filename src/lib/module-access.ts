import { AccountantModule, SessionUser, UserRole } from '@/types';

export function hasFullModuleAccess(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN;
}

export function hasModuleAccess(user: SessionUser, module: AccountantModule): boolean {
  if (hasFullModuleAccess(user.role)) return true;
  return user.moduleAccess?.includes(module) ?? false;
}

export function requireModuleAccess(user: SessionUser, module: AccountantModule): void {
  if (!hasModuleAccess(user, module)) {
    throw new ModuleAccessError(module);
  }
}

export class ModuleAccessError extends Error {
  constructor(public module: AccountantModule) {
    super(`Access denied for module: ${module}`);
    this.name = 'ModuleAccessError';
  }
}

export function getAccessibleModules(user: SessionUser): AccountantModule[] {
  if (hasFullModuleAccess(user.role)) {
    return Object.values(AccountantModule);
  }
  return user.moduleAccess ?? [];
}
