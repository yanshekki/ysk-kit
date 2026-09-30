import type { CreateCourseCommand, PageQuery } from '@ysk/contracts';
import type { ICourseRepository } from '../domain/course-repository';

export const createCourseService = (repo: ICourseRepository) => ({
  list: (authorId: string, query: PageQuery) => repo.listForAuthor(authorId, query),
  create: (authorId: string, input: CreateCourseCommand) => repo.create(authorId, input),
});

export type CourseService = ReturnType<typeof createCourseService>;
