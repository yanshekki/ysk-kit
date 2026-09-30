import type { CreateRsvpCommand, PageQuery } from '@ysk/contracts';
import { AppError } from '@ysk/domain-kernel';
import type { IRsvpRepository } from '../domain/rsvp-repository';

export const createRsvpService = (repo: IRsvpRepository) => ({
  list: (authorId: string, query: PageQuery) => repo.listForAuthor(authorId, query),
  create: async (authorId: string, input: CreateRsvpCommand) => {
    const event = await repo.getEvent(input.eventId);
    if (!event) throw new AppError('NOT_FOUND');
    const existing = await repo.findByEventEmail(input.eventId, input.email);
    if (existing) throw new AppError('CONFLICT', 'That email already RSVPed');
    const count = await repo.countForEvent(input.eventId);
    if (count >= event.capacity) throw new AppError('CONFLICT', 'That event is full');
    return repo.create(authorId, input);
  },
});

export type RsvpService = ReturnType<typeof createRsvpService>;
