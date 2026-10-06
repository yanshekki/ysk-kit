import { z } from 'zod';
import { PaginatedSchema } from './user.js';

export const ApplicationDtoSchema = z.object({
  id: z.string().uuid(),
  jobId: z.string().uuid(),
  applicantName: z.string().min(1).max(80),
  email: z.string().email(),
  cover: z.string().min(1).max(500),
  authorId: z.string().uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type ApplicationDto = z.infer<typeof ApplicationDtoSchema>;

export const PaginatedApplicationSchema = PaginatedSchema(ApplicationDtoSchema);
export type PaginatedApplication = z.infer<typeof PaginatedApplicationSchema>;

export const CreateApplicationCommandSchema = z.object({
  jobId: z.string().uuid(),
  applicantName: z.string().min(1).max(80),
  email: z.string().email(),
  cover: z.string().min(1).max(500),
});
export type CreateApplicationCommand = z.infer<typeof CreateApplicationCommandSchema>;
