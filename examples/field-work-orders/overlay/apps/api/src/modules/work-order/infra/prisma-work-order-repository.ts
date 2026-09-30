import { slicePage } from '@ysk/application';
import type { WorkOrderDto, WorkOrderStatus } from '@ysk/contracts';
import type { PrismaClient } from '../../../generated/prisma/client';
import type { IWorkOrderRepository } from '../domain/work-order-repository';

const toDto = (row: {
  id: string;
  title: string;
  address: string;
  status: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}): WorkOrderDto => ({
  id: row.id,
  title: row.title,
  address: row.address,
  status: row.status as WorkOrderStatus,
  authorId: row.authorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const createPrismaWorkOrderRepository = (prisma: PrismaClient): IWorkOrderRepository => ({
  async create(authorId, input) {
    const row = await prisma.workOrder.create({
      data: {
        title: input.title,
        address: input.address,
        status: 'NEW',
        authorId,
      },
    });
    return toDto(row);
  },
  async listForAuthor(authorId, query) {
    const rows = await prisma.workOrder.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const page = slicePage(rows, query.limit);
    return { items: page.items.map(toDto), nextCursor: page.nextCursor };
  },
  async getById(id) {
    const row = await prisma.workOrder.findUnique({ where: { id } });
    if (!row) return null;
    return { ...row, status: row.status as WorkOrderStatus };
  },
  async updateStatus(id, status) {
    const row = await prisma.workOrder.update({ where: { id }, data: { status } });
    return toDto(row);
  },
});
