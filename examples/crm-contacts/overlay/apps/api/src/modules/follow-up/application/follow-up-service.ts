import type { CreateFollowUpCommand, PageQuery } from '@ysk-kit/contracts';
import { AppError } from '@ysk-kit/domain-kernel';
import type { IFollowUpRepository } from '../domain/follow-up-repository';

export const createFollowUpService = (repo: IFollowUpRepository) => ({
  list: (authorId: string, query: PageQuery) => repo.listForAuthor(authorId, query),
  create: async (authorId: string, input: CreateFollowUpCommand) => {
    const contact = await repo.getContact(input.contactId);
    if (!contact || contact.authorId !== authorId) throw new AppError('NOT_FOUND');
    return repo.create(authorId, input);
  },
});

export type FollowUpService = ReturnType<typeof createFollowUpService>;
