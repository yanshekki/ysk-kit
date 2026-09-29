import type { User } from '@prisma/client';
import type { UserDto } from '@ysk/contracts';
import type { UserRecord } from '../domain/user';

export const toUserRecord = (row: User): UserRecord => ({
  id: row.id,
  email: row.email,
  phone: row.phone,
  displayName: row.displayName,
  role: row.role,
  status: row.status,
  passwordHash: row.passwordHash,
  createdAt: row.createdAt,
});

export const toUserDto = (row: UserRecord): UserDto => ({
  id: row.id,
  email: row.email,
  phone: row.phone,
  displayName: row.displayName,
  role: row.role,
  status: row.status,
  createdAt: row.createdAt.toISOString(),
});
