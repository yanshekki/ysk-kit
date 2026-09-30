import type { CreateEnrollmentCommand, PageQuery } from '@ysk-kit/contracts';
import { AppError } from '@ysk-kit/domain-kernel';
import type { IEnrollmentRepository } from '../domain/enrollment-repository';

export const createEnrollmentService = (repo: IEnrollmentRepository) => ({
  list: (authorId: string, query: PageQuery) => repo.listForAuthor(authorId, query),
  create: async (authorId: string, input: CreateEnrollmentCommand) => {
    const course = await repo.getCourse(input.courseId);
    if (!course || course.authorId !== authorId) throw new AppError('NOT_FOUND');
    const existing = await repo.findByCourseEmail(input.courseId, input.email);
    if (existing) throw new AppError('CONFLICT', 'That email is already enrolled');
    const taken = await repo.countForCourse(input.courseId);
    if (taken >= course.quota) throw new AppError('CONFLICT', 'That course is full');
    return repo.create(authorId, input);
  },
});

export type EnrollmentService = ReturnType<typeof createEnrollmentService>;
