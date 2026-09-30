import type { CreateEventCommand, PageQuery } from '@ysk-kit/contracts';
import { AppError } from '@ysk-kit/domain-kernel';
import type { IEventRepository } from '../domain/event-repository';

export const createEventService = (repo: IEventRepository) => ({
  list: (authorId: string, query: PageQuery) => repo.listForAuthor(authorId, query),
  create: async (authorId: string, input: CreateEventCommand) => {
    if (!Number.isInteger(input.capacity) || input.capacity < 1) {
      throw new AppError('VALIDATION_FAILED', 'capacity must be a positive integer');
    }
    return repo.create(authorId, input);
  },
});

export type EventService = ReturnType<typeof createEventService>;
