import { z } from 'zod';
import { PermissionSchema } from '../enums/permission';

export const CreateApiKeyCommandSchema = z.object({
  name: z.string().min(1).max(80),
  permissions: z.array(PermissionSchema).min(1),
});
export type CreateApiKeyCommand = z.infer<typeof CreateApiKeyCommandSchema>;

export const ApiKeyDtoSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(80),
  prefix: z.string().min(8).max(32),
  last4: z.string().length(4),
  permissions: z.array(PermissionSchema),
  createdAt: z.iso.datetime(),
  lastUsedAt: z.iso.datetime().nullable(),
});
export type ApiKeyDto = z.infer<typeof ApiKeyDtoSchema>;

export const CreatedApiKeyDtoSchema = ApiKeyDtoSchema.extend({
  token: z.string().min(16),
});
export type CreatedApiKeyDto = z.infer<typeof CreatedApiKeyDtoSchema>;
