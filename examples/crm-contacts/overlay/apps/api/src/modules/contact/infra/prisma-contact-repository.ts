import { slicePage } from '@ysk/application';
import type { ContactDto, ContactStatus } from '@ysk/contracts';
import type { PrismaClient } from '../../../generated/prisma/client';
import type { IContactRepository } from '../domain/contact-repository';

const toDto = (row: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  status: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}): ContactDto => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  company: row.company,
  status: row.status as ContactStatus,
  authorId: row.authorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const createPrismaContactRepository = (prisma: PrismaClient): IContactRepository => ({
  async create(authorId, input) {
    const row = await prisma.contact.create({
      data: {
        name: input.name,
        email: input.email,
        ...(input.phone ? { phone: input.phone } : {}),
        ...(input.company ? { company: input.company } : {}),
        status: 'LEAD',
        authorId,
      },
    });
    return toDto(row);
  },
  async listForAuthor(authorId, query) {
    const rows = await prisma.contact.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const page = slicePage(rows, query.limit);
    return { items: page.items.map(toDto), nextCursor: page.nextCursor };
  },
  async getById(id) {
    const row = await prisma.contact.findUnique({ where: { id } });
    if (!row) return null;
    return { ...row, status: row.status as ContactStatus };
  },
  async findByAuthorEmail(authorId, email) {
    const row = await prisma.contact.findFirst({ where: { authorId, email } });
    if (!row) return null;
    return { ...row, status: row.status as ContactStatus };
  },
  async updateStatus(id, status) {
    const row = await prisma.contact.update({ where: { id }, data: { status } });
    return toDto(row);
  },
});
