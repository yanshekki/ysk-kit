import type { CreateQuoteCommand, PageQuery } from '@ysk/contracts';
import { AppError } from '@ysk/domain-kernel';
import type { IQuoteRepository } from '../domain/quote-repository';

export const createQuoteService = (repo: IQuoteRepository) => ({
  list: (authorId: string, query: PageQuery) => repo.listForAuthor(authorId, query),
  create: (authorId: string, input: CreateQuoteCommand) => repo.create(authorId, input),
  send: async (authorId: string, id: string) => {
    const row = await repo.getById(id);
    if (!row || row.authorId !== authorId) throw new AppError('NOT_FOUND');
    if (row.status !== 'DRAFT' || row.amountHkd <= 0) {
      throw new AppError('CONFLICT', 'Only DRAFT quotes with a positive amount can be sent');
    }
    return repo.updateStatus(id, 'SENT');
  },
  accept: async (authorId: string, id: string) => {
    const row = await repo.getById(id);
    if (!row || row.authorId !== authorId) throw new AppError('NOT_FOUND');
    if (row.status !== 'SENT') throw new AppError('CONFLICT', 'Only SENT quotes can be accepted');
    return repo.updateStatus(id, 'ACCEPTED');
  },
});

export type QuoteService = ReturnType<typeof createQuoteService>;
