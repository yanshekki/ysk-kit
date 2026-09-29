import { type HttpHandler, mountContract } from '@ysk/api-express';
import { appContract, type PageQuery } from '@ysk/contracts';
import { AppError } from '@ysk/domain-kernel';
import type { Express } from 'express';
import type { NotificationService } from '../application/notification-service';

export const notificationHandlers = (
  service: NotificationService,
): Record<string, HttpHandler> => ({
  list: {
    auth: 'required',
    handle: async ({ query, auth }) => {
      if (!auth) throw new AppError('UNAUTHENTICATED');
      return {
        status: 200,
        body: { ok: true, data: await service.list(auth.sub, query as PageQuery) },
      };
    },
  },
  markRead: {
    auth: 'required',
    handle: async ({ params, auth }) => {
      if (!auth) throw new AppError('UNAUTHENTICATED');
      return {
        status: 200,
        body: {
          ok: true,
          data: await service.markRead((params as { id: string }).id, auth.sub),
        },
      };
    },
  },
});

export const registerNotificationRoutes = (app: Express, service: NotificationService): void => {
  mountContract(app, appContract.notifications, notificationHandlers(service));
};
