import { z } from 'zod';
import { PaginatedSchema } from './user.js';

export const CourseDtoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(80),
  quota: z.number().int().positive(),
  startsOn: z.iso.date(),
  authorId: z.string().uuid(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type CourseDto = z.infer<typeof CourseDtoSchema>;

export const PaginatedCourseSchema = PaginatedSchema(CourseDtoSchema);
export type PaginatedCourse = z.infer<typeof PaginatedCourseSchema>;

export const CreateCourseCommandSchema = z.object({
  title: z.string().min(1).max(80),
  quota: z.number().int().positive(),
  startsOn: z.iso.date(),
});
export type CreateCourseCommand = z.infer<typeof CreateCourseCommandSchema>;
