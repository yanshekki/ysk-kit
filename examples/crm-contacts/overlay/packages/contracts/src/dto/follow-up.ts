import { z } from 'zod';
import { PaginatedSchema } from './user.js';

export const FollowUpDtoSchema = z.object({
  id: z.string().uuid(),
  contactId: z.string().uuid(),
  dueAt: z.iso.datetime(),
  note: z.string().min(1).max(500),
  authorId: z.string().uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type FollowUpDto = z.infer<typeof FollowUpDtoSchema>;

export const PaginatedFollowUpSchema = PaginatedSchema(FollowUpDtoSchema);
export type PaginatedFollowUp = z.infer<typeof PaginatedFollowUpSchema>;

export const CreateFollowUpCommandSchema = z.object({
  contactId: z.string().uuid(),
  dueAt: z.iso.datetime(),
  note: z.string().min(1).max(500),
});
export type CreateFollowUpCommand = z.infer<typeof CreateFollowUpCommandSchema>;
