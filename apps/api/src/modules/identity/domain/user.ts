import type { UserRole, UserStatus } from '@ysk-kit/contracts';

export type UserRecord = {
  id: string;
  email: string | null;
  phone: string | null;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  passwordHash: string | null;
  createdAt: Date;
};
