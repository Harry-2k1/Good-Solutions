import { UserRole } from '@/types';

export function canManageUsers(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN;
}

export function canCreateRole(creatorRole: UserRole, targetRole: UserRole): boolean {
  if (creatorRole === UserRole.SUPER_ADMIN) {
    return targetRole === UserRole.ADMIN || targetRole === UserRole.USER;
  }
  if (creatorRole === UserRole.ADMIN) {
    return targetRole === UserRole.USER;
  }
  return false;
}

export function canViewUsers(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN;
}

export function getCreatableRoles(role: UserRole): UserRole[] {
  if (role === UserRole.SUPER_ADMIN) {
    return [UserRole.ADMIN, UserRole.USER];
  }
  if (role === UserRole.ADMIN) {
    return [UserRole.USER];
  }
  return [];
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return 'Super Admin';
    case UserRole.ADMIN:
      return 'Admin (Manager)';
    case UserRole.USER:
      return 'Accountant';
    default:
      return role;
  }
}
