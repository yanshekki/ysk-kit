import { slicePage } from '@ysk-kit/application';
import type { NotificationType } from '@ysk-kit/contracts';
import type { PrismaClient } from '../../../generated/prisma/client';
import { prismaIdCursor } from '../../../infra/prisma-page';
import type { INotificationRepository } from '../domain/notification-repository';

export const createPrismaNotificationRepository = (
  prisma: PrismaClient,
): INotificationRepository => ({
  async create(input) {
    const row = await prisma.notification.create({ data: input });
    return { ...row, type: row.type as NotificationType };
  },
  async listForUser(userId, query) {
    const rows = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: query.limit + 1,
      ...prismaIdCursor(query.cursor),
    });
    const page = slicePage(rows, query.limit);
    return {
      items: page.items.map((row) => ({
        id: row.id,
        type: row.type as NotificationType,
        title: row.title,
        body: row.body,
        readAt: row.readAt ? row.readAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
      })),
      nextCursor: page.nextCursor,
    };
  },
  async markRead(id, userId, at) {
    const row = await prisma.notification.findFirst({ where: { id, userId } });
    if (!row) return false;
    await prisma.notification.update({ where: { id }, data: { readAt: at } });
    return true;
  },
});
