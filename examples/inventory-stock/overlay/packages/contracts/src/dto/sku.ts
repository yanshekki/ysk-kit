import { z } from 'zod';
import { PaginatedSchema } from './user.js';

export const SkuDtoSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1).max(40),
  name: z.string().min(1).max(80),
  qtyOnHand: z.number().int().nonnegative(),
  authorId: z.string().uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type SkuDto = z.infer<typeof SkuDtoSchema>;

export const PaginatedSkuSchema = PaginatedSchema(SkuDtoSchema);
export type PaginatedSku = z.infer<typeof PaginatedSkuSchema>;

export const CreateSkuCommandSchema = z.object({
  code: z.string().min(1).max(40),
  name: z.string().min(1).max(80),
  qtyOnHand: z.number().int().nonnegative(),
});
export type CreateSkuCommand = z.infer<typeof CreateSkuCommandSchema>;
