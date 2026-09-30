import type { CreateJobCommand, PageQuery } from '@ysk-kit/contracts';
import { AppError } from '@ysk-kit/domain-kernel';
import type { IJobRepository } from '../domain/job-repository';

export const createJobService = (repo: IJobRepository) => ({
  list: (authorId: string, query: PageQuery) => repo.listForAuthor(authorId, query),
  create: (authorId: string, input: CreateJobCommand) => repo.create(authorId, input),
  publish: async (authorId: string, id: string) => {
    const row = await repo.getById(id);
    if (!row || row.authorId !== authorId) throw new AppError('NOT_FOUND');
    if (row.published) throw new AppError('CONFLICT', 'That job is already published');
    return repo.updatePublished(id, true);
  },
});

export type JobService = ReturnType<typeof createJobService>;
