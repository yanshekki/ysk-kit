import { slicePage } from '@ysk/application';
import type { OrgRole, TicketDto, TicketStatus } from '@ysk/contracts';
import type { PrismaClient } from '../../../generated/prisma/client';
import type { ITicketRepository } from '../domain/ticket-repository';

const toDto = (row: {
  id: string;
  title: string;
  body: string;
  organizationId: string;
  status: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}): TicketDto => ({
  id: row.id,
  title: row.title,
  body: row.body,
  organizationId: row.organizationId,
  status: row.status as TicketStatus,
  authorId: row.authorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const createPrismaTicketRepository = (prisma: PrismaClient): ITicketRepository => ({
  async create(authorId, input) {
    const row = await prisma.ticket.create({
      data: {
        title: input.title,
        body: input.body,
        organizationId: input.organizationId,
        status: 'OPEN',
        authorId,
      },
    });
    return toDto(row);
  },
  async listForOrganization(organizationId, query) {
    const rows = await prisma.ticket.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const page = slicePage(rows, query.limit);
    return { items: page.items.map(toDto), nextCursor: page.nextCursor };
  },
  async getById(id) {
    const row = await prisma.ticket.findUnique({ where: { id } });
    if (!row) return null;
    return { ...row, status: row.status as TicketStatus };
  },
  async updateStatus(id, status) {
    const row = await prisma.ticket.update({ where: { id }, data: { status } });
    return toDto(row);
  },
  async getMembership(userId, organizationId) {
    const row = await prisma.membership.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
    if (!row) return null;
    return { role: row.role as OrgRole };
  },
});
