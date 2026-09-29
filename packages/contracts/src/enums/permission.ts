import { z } from 'zod';
import type { UserRole } from './user-role';

export const Permission = {
  USER_CREATE: 'user.create',
  USER_SUSPEND: 'user.suspend',
  AUDIT_READ: 'audit.read',
  FILE_UPLOAD: 'file.upload',
  LLM_USE: 'llm.use',
  BILLING_CHECKOUT: 'billing.checkout',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];
export const PERMISSION_VALUES = Object.values(Permission) as [Permission, ...Permission[]];
export const PermissionSchema = z.enum(PERMISSION_VALUES);

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  USER: [Permission.FILE_UPLOAD, Permission.LLM_USE, Permission.BILLING_CHECKOUT],
  OPS: [
    Permission.FILE_UPLOAD,
    Permission.USER_CREATE,
    Permission.AUDIT_READ,
    Permission.LLM_USE,
    Permission.BILLING_CHECKOUT,
  ],
  ADMIN: [
    Permission.FILE_UPLOAD,
    Permission.USER_CREATE,
    Permission.USER_SUSPEND,
    Permission.AUDIT_READ,
    Permission.LLM_USE,
    Permission.BILLING_CHECKOUT,
  ],
};

export const roleHasPermission = (role: UserRole, permission: Permission): boolean =>
  ROLE_PERMISSIONS[role].includes(permission);

export const claimsHasPermission = (
  claims: { role: UserRole; permissions?: readonly Permission[] },
  permission: Permission,
): boolean => {
  if (claims.permissions) return claims.permissions.includes(permission);
  return roleHasPermission(claims.role, permission);
};
