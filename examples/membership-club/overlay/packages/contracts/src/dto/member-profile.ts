import { z } from 'zod';
import { PaginatedSchema } from './user.js';

export const MemberProfileDtoSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().min(1).max(80),
  organizationId: z.string().uuid(),
  authorId: z.string().uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type MemberProfileDto = z.infer<typeof MemberProfileDtoSchema>;

export const PaginatedMemberProfileSchema = PaginatedSchema(MemberProfileDtoSchema);
export type PaginatedMemberProfile = z.infer<typeof PaginatedMemberProfileSchema>;

export const CreateMemberProfileCommandSchema = z.object({
  displayName: z.string().min(1).max(80),
  organizationId: z.string().uuid(),
});
export type CreateMemberProfileCommand = z.infer<typeof CreateMemberProfileCommandSchema>;
