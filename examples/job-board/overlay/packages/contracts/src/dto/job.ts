import { z } from 'zod';
import { PaginatedSchema } from './user';

export const JobDtoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(80),
  department: z.string().min(1).max(80),
  published: z.boolean(),
  authorId: z.string().uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type JobDto = z.infer<typeof JobDtoSchema>;

export const PaginatedJobSchema = PaginatedSchema(JobDtoSchema);
export type PaginatedJob = z.infer<typeof PaginatedJobSchema>;

export const CreateJobCommandSchema = z.object({
  title: z.string().min(1).max(80),
  department: z.string().min(1).max(80),
});
export type CreateJobCommand = z.infer<typeof CreateJobCommandSchema>;
