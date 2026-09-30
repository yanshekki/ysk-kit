import { slicePage } from '@ysk/application';
import type { FollowUpDto } from '@ysk/contracts';
import type { PrismaClient } from '../../../generated/prisma/client';
import type { IFollowUpRepository } from '../domain/follow-up-repository';

const toDto = (row: {
  id: string;
  contactId: string;
  dueAt: Date;
  note: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}): FollowUpDto => ({
  id: row.id,
  contactId: row.contactId,
  dueAt: row.dueAt.toISOString(),
  note: row.note,
  authorId: row.authorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const createPrismaFollowUpRepository = (prisma: PrismaClient): IFollowUpRepository => ({
  async create(authorId, input) {
    const row = await prisma.followUp.create({
      data: {
        contactId: input.contactId,
        dueAt: new Date(input.dueAt),
        note: input.note,
        authorId,
      },
    });
    return toDto(row);
  },
  async listForAuthor(authorId, query) {
    const rows = await prisma.followUp.findMany({
      where: { authorId },
      orderBy: { dueAt: 'asc' },
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const page = slicePage(rows, query.limit);
    return { items: page.items.map(toDto), nextCursor: page.nextCursor };
  },
  async getContact(id) {
    const row = await prisma.contact.findUnique({ where: { id } });
    if (!row) return null;
    return { id: row.id, authorId: row.authorId };
  },
});
