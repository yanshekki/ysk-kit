import { slicePage } from '@ysk/application';
import type { EventDto } from '@ysk/contracts';
import type { PrismaClient } from '../../../generated/prisma/client';
import type { IEventRepository } from '../domain/event-repository';

const toDto = (row: {
  id: string;
  title: string;
  venue: string;
  startsAt: Date;
  capacity: number;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}): EventDto => ({
  id: row.id,
  title: row.title,
  venue: row.venue,
  startsAt: row.startsAt.toISOString(),
  capacity: row.capacity,
  authorId: row.authorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const createPrismaEventRepository = (prisma: PrismaClient): IEventRepository => ({
  async create(authorId, input) {
    const row = await prisma.event.create({
      data: {
        title: input.title,
        venue: input.venue,
        startsAt: new Date(input.startsAt),
        capacity: input.capacity,
        authorId,
      },
    });
    return toDto(row);
  },
  async listForAuthor(authorId, query) {
    const rows = await prisma.event.findMany({
      where: { authorId },
      orderBy: { startsAt: 'asc' },
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const page = slicePage(rows, query.limit);
    return { items: page.items.map(toDto), nextCursor: page.nextCursor };
  },
  async getById(id) {
    return prisma.event.findUnique({ where: { id } });
  },
});
