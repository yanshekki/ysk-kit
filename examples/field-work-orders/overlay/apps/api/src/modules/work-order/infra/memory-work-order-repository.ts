import { slicePage } from '@ysk/application';
import type { WorkOrderDto, WorkOrderStatus } from '@ysk/contracts';
import type { IWorkOrderRepository, WorkOrderRecord } from '../domain/work-order-repository';

const toDto = (row: WorkOrderRecord): WorkOrderDto => ({
  id: row.id,
  title: row.title,
  address: row.address,
  status: row.status,
  authorId: row.authorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const createMemoryWorkOrderRepository = (): IWorkOrderRepository => {
  const rows: WorkOrderRecord[] = [];
  return {
    async create(authorId, input) {
      const now = new Date();
      const row: WorkOrderRecord = {
        id: crypto.randomUUID(),
        title: input.title,
        address: input.address,
        status: 'NEW',
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
    async updateStatus(id, status: WorkOrderStatus) {
      const row = rows.find((item) => item.id === id);
      if (!row) throw new Error(`work-order ${id} missing`);
      row.status = status;
      row.updatedAt = new Date();
      return toDto(row);
    },
  };
};
