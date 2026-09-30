import type { CreateWorkOrderCommand, PageQuery } from '@ysk/contracts';
import { AppError } from '@ysk/domain-kernel';
import type { IJobQueue } from '@ysk/jobs';
import type { IWorkOrderRepository } from '../domain/work-order-repository';

export const createWorkOrderService = (repo: IWorkOrderRepository, jobs?: IJobQueue) => ({
  list: (authorId: string, query: PageQuery) => repo.listForAuthor(authorId, query),
  create: (authorId: string, input: CreateWorkOrderCommand) => repo.create(authorId, input),
  assign: async (authorId: string, id: string) => {
    const row = await repo.getById(id);
    if (!row || row.authorId !== authorId) throw new AppError('NOT_FOUND');
    if (row.status !== 'NEW') throw new AppError('CONFLICT', 'Only NEW rows can be assigned');
    const next = await repo.updateStatus(id, 'ASSIGNED');
    if (jobs) {
      await jobs.enqueue('notification.create', {
        userId: authorId,
        type: 'work.assigned',
        title: row.title,
        body: `Assigned: ${row.address}`,
      });
    }
    return next;
  },
  complete: async (authorId: string, id: string) => {
    const row = await repo.getById(id);
    if (!row || row.authorId !== authorId) throw new AppError('NOT_FOUND');
    if (row.status !== 'ASSIGNED')
      throw new AppError('CONFLICT', 'Only ASSIGNED rows can complete');
    return repo.updateStatus(id, 'DONE');
  },
});

export type WorkOrderService = ReturnType<typeof createWorkOrderService>;
