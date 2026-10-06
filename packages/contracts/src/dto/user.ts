import { z } from 'zod';
import { HK } from '../constants/hk.js';
import { UserRoleSchema } from '../enums/user-role.js';
import { UserStatusSchema } from '../enums/user-status.js';

export const PageQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type PageQuery = z.infer<typeof PageQuerySchema>;

export const PaginatedSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  });

export const HkPhoneSchema = z
  .string()
  .regex(new RegExp(`^\\${HK.phonePrefix}[0-9]{8}$`), 'Expected +852 and 8 digits');

export const UserDtoSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  displayName: z.string().min(1).max(80),
  role: UserRoleSchema,
  status: UserStatusSchema,
  createdAt: z.iso.datetime(),
});

export type UserDto = z.infer<typeof UserDtoSchema>;

export const PaginatedUsersSchema = PaginatedSchema(UserDtoSchema);
export type PaginatedUsers = z.infer<typeof PaginatedUsersSchema>;

export const CreateUserCommandSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(80),
  role: UserRoleSchema.default('USER'),
});

export type CreateUserCommand = z.infer<typeof CreateUserCommandSchema>;
