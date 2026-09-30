import { slicePage } from '@ysk-kit/application';
import type { RsvpDto } from '@ysk-kit/contracts';
import type { IRsvpRepository, RsvpEventRef, RsvpRecord } from '../domain/rsvp-repository';

const toDto = (row: RsvpRecord): RsvpDto => ({
  id: row.id,
  eventId: row.eventId,
  attendeeName: row.attendeeName,
  email: row.email,
  authorId: row.authorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export type EventLookup = {
  getById: (id: string) => Promise<RsvpEventRef | null>;
};

export const createMemoryRsvpRepository = (events?: EventLookup): IRsvpRepository => {
  const rows: RsvpRecord[] = [];
  return {
    async create(authorId, input) {
      const now = new Date();
      const row: RsvpRecord = {
        id: crypto.randomUUID(),
        eventId: input.eventId,
        attendeeName: input.attendeeName,
        email: input.email,
        authorId,
        createdAt: now,
        updatedAt: now,
      };
      rows.unshift(row);
      return toDto(row);
    },
    async listForAuthor(authorId, query) {
      const mine = rows.filter((row) => row.authorId === authorId);
      const page = slicePage(mine, query.limit);
      return { items: page.items.map(toDto), nextCursor: page.nextCursor };
    },
    async getEvent(id) {
      if (!events) return null;
      const row = await events.getById(id);
      if (!row) return null;
      return { id: row.id, capacity: row.capacity };
    },
    async countForEvent(eventId) {
      return rows.filter((row) => row.eventId === eventId).length;
    },
    async findByEventEmail(eventId, email) {
      return rows.find((row) => row.eventId === eventId && row.email === email) ?? null;
    },
  };
};
