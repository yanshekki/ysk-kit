import type { CreateApplicationCommand, PageQuery } from '@ysk-kit/contracts';
import { AppError } from '@ysk-kit/domain-kernel';
import type { IApplicationRepository } from '../domain/application-repository';

export const createApplicationService = (repo: IApplicationRepository) => ({
  list: (authorId: string, query: PageQuery) => repo.listForAuthor(authorId, query),
  create: async (authorId: string, input: CreateApplicationCommand) => {
    const job = await repo.getJob(input.jobId);
    if (!job) throw new AppError('NOT_FOUND');
    if (!job.published) throw new AppError('CONFLICT', 'That job is not published');
    const existing = await repo.findByJobEmail(input.jobId, input.email);
    if (existing) throw new AppError('CONFLICT', 'That email already applied');
    return repo.create(authorId, input);
  },
});

export type ApplicationService = ReturnType<typeof createApplicationService>;
