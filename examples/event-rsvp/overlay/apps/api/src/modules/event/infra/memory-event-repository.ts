import { slicePage } from '@ysk/application';
import type { EventDto } from '@ysk/contracts';
import type { EventRecord, IEventRepository } from '../domain/event-repository';

const toDto = (row: EventRecord): EventDto => ({
  id: row.id,
  title: row.title,
  venue: row.venue,
  startsAt: row.startsAt.toISOString(),
  capacity: row.capacity,
  authorId: row.authorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const createMemoryEventRepository = (): IEventRepository => {
  const rows: EventRecord[] = [];
  return {
    async create(authorId, input) {
      const now = new Date();
      const row: EventRecord = {
        id: crypto.randomUUID(),
        title: input.title,
        venue: input.venue,
        startsAt: new Date(input.startsAt),
        capacity: input.capacity,
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
    async getById(id) {
      return rows.find((row) => row.id === id) ?? null;
    },
  };
};
