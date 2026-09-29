import type { Permission, UserRole } from '@ysk/contracts';
import { canAct } from '@ysk/ui-logic';
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
