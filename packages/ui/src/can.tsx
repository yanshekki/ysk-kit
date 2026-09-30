import type { Permission, UserRole } from '@ysk-kit/contracts';
import { canAct } from '@ysk-kit/ui-logic';
import type { ReactNode } from 'react';

export function Can({
  role,
  permission,
  children,
}: {
  role: UserRole;
  permission: Permission;
  children: ReactNode;
}) {
  if (!canAct(role, permission)) return null;
  return children;
}
