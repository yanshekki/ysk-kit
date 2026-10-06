import { z } from 'zod';
import { PaginatedSchema } from './user.js';

export const EnrollmentDtoSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  studentName: z.string().min(1).max(80),
  email: z.string().email(),
  authorId: z.string().uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type EnrollmentDto = z.infer<typeof EnrollmentDtoSchema>;

export const PaginatedEnrollmentSchema = PaginatedSchema(EnrollmentDtoSchema);
export type PaginatedEnrollment = z.infer<typeof PaginatedEnrollmentSchema>;

export const CreateEnrollmentCommandSchema = z.object({
  courseId: z.string().uuid(),
  studentName: z.string().min(1).max(80),
  email: z.string().email(),
});
export type CreateEnrollmentCommand = z.infer<typeof CreateEnrollmentCommandSchema>;
