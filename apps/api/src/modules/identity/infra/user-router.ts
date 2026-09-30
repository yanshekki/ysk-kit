import { type HttpHandler, mountContract } from '@ysk-kit/api-express';
import { appContract, type PageQuery } from '@ysk-kit/contracts';
import { AppError } from '@ysk-kit/domain-kernel';
import type { Express } from 'express';
import type { UserService } from '../application/user-service';

export const userHandlers = (service: UserService): Record<string, HttpHandler> => ({
  list: {
    auth: 'required',
    handle: async ({ query }) => ({
      status: 200,
      body: { ok: true, data: await service.list(query as PageQuery) },
    }),
  },
  create: {
    auth: 'required',
    permission: 'user.create',
    handle: async ({ body, auth }) => ({
      status: 201,
      body: { ok: true, data: await service.create(body, auth?.sub) },
    }),
  },
  suspend: {
    auth: 'required',
    permission: 'user.suspend',
    handle: async ({ params, auth }) => {
      if (!auth) throw new AppError('UNAUTHENTICATED');
      return {
        status: 200,
        body: { ok: true, data: await service.suspend(auth.sub, (params as { id: string }).id) },
      };
    },
  },
});

export const registerUserRoutes = (app: Express, service: UserService): void => {
  mountContract(app, appContract.users, userHandlers(service));
};
