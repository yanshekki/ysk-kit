import { slicePage } from '@ysk-kit/application';
import type { NotificationDto } from '@ysk-kit/contracts';
import type {
  INotificationRepository,
  NotificationRecord,
} from '../domain/notification-repository';

const toDto = (row: NotificationRecord): NotificationDto => ({
  id: row.id,
  type: row.type,
  title: row.title,
  body: row.body,
  readAt: row.readAt ? row.readAt.toISOString() : null,
  createdAt: row.createdAt.toISOString(),
});

export const createMemoryNotificationRepository = (): INotificationRepository => {
  const rows: NotificationRecord[] = [];
  return {
    async create(input) {
      const row: NotificationRecord = {
        id: crypto.randomUUID(),
        readAt: null,
        createdAt: new Date(),
        ...input,
      };
      rows.unshift(row);
      return row;
    },
    async listForUser(userId, query) {
      const mine = rows.filter((row) => row.userId === userId);
      const page = slicePage(mine, query.limit);
      return { items: page.items.map(toDto), nextCursor: page.nextCursor };
    },
    async markRead(id, userId, at) {
      const row = rows.find((item) => item.id === id && item.userId === userId);
      if (!row) return false;
      row.readAt = at;
      return true;
    },
  };
};
