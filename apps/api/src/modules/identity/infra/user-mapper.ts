import type { User } from '@prisma/client';
import type { UserDto } from '@ysk/contracts';

export const toUserDto = (row: User): UserDto => ({
  id: row.id,
  email: row.email,
  displayName: row.displayName,
  role: row.role,
  status: row.status,
  createdAt: row.createdAt.toISOString(),
});
