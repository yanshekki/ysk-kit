import { z } from 'zod';
import { USER_ROLE_VALUES } from '../enums/user-role';
import { USER_STATUS_VALUES } from '../enums/user-status';

export const PageQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type PageQuery = z.infer<typeof PageQuerySchema>;

export const UserDtoSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().min(1).max(80),
  role: z.enum(USER_ROLE_VALUES),
  status: z.enum(USER_STATUS_VALUES),
  createdAt: z.string().datetime(),
});

export type UserDto = z.infer<typeof UserDtoSchema>;

export const CreateUserCommandSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(80),
  role: z.enum(USER_ROLE_VALUES).default('USER'),
});

export type CreateUserCommand = z.infer<typeof CreateUserCommandSchema>;
