import type { PageQuery } from '@ysk-kit/contracts';
import { AppError } from '@ysk-kit/domain-kernel';
import type { INotificationRepository } from '../domain/notification-repository';

export const createNotificationService = (repo: INotificationRepository) => ({
  list: (userId: string, query: PageQuery) => repo.listForUser(userId, query),
  markRead: async (id: string, userId: string) => {
    const ok = await repo.markRead(id, userId, new Date());
    if (!ok) throw new AppError('NOT_FOUND');
    return { read: true as const };
  },
});

export type NotificationService = ReturnType<typeof createNotificationService>;
