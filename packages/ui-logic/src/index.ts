import {
  type OrgAction,
  type OrgRole,
  orgRoleCan as orgRoleHasAction,
  type Permission,
  roleHasPermission,
  USER_STATUS_LABELS,
  type UserRole,
  type UserStatus,
} from '@ysk-kit/contracts';

export const formatHkd = (amount: number): string => `$${amount.toLocaleString('en-HK')}`;

export const userStatusLabel = (status: UserStatus, locale: 'zh-HK' | 'en' = 'zh-HK'): string =>
  USER_STATUS_LABELS[status][locale];

export const canAct = (role: UserRole, permission: Permission): boolean =>
  roleHasPermission(role, permission);

export const orgRoleCan = (role: OrgRole, action: OrgAction): boolean =>
  orgRoleHasAction(role, action);
