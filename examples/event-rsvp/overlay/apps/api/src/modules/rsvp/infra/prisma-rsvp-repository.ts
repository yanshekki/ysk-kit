import { slicePage } from '@ysk-kit/application';
import type { RsvpDto } from '@ysk-kit/contracts';
import type { PrismaClient } from '../../../generated/prisma/client';
import type { IRsvpRepository } from '../domain/rsvp-repository';

const toDto = (row: {
  id: string;
  eventId: string;
  attendeeName: string;
  email: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}): RsvpDto => ({
  id: row.id,
  eventId: row.eventId,
  attendeeName: row.attendeeName,
  email: row.email,
  authorId: row.authorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const createPrismaRsvpRepository = (prisma: PrismaClient): IRsvpRepository => ({
  async create(authorId, input) {
    const row = await prisma.rsvp.create({
      data: {
        eventId: input.eventId,
        attendeeName: input.attendeeName,
        email: input.email,
        authorId,
      },
    });
    return toDto(row);
  },
  async listForAuthor(authorId, query) {
    const rows = await prisma.rsvp.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const page = slicePage(rows, query.limit);
    return { items: page.items.map(toDto), nextCursor: page.nextCursor };
  },
  async getEvent(id) {
    const row = await prisma.event.findUnique({ where: { id } });
    if (!row) return null;
    return { id: row.id, capacity: row.capacity };
  },
  async countForEvent(eventId) {
    return prisma.rsvp.count({ where: { eventId } });
  },
  async findByEventEmail(eventId, email) {
    return prisma.rsvp.findFirst({ where: { eventId, email } });
  },
});
