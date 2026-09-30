import { type HttpHandler, mountContract } from '@ysk/api-express';
import { appContract, type CreateFollowUpCommand, type PageQuery } from '@ysk/contracts';
import { AppError } from '@ysk/domain-kernel';
import type { Express } from 'express';
import type { FollowUpService } from '../application/follow-up-service';

export const followUpHandlers = (service: FollowUpService): Record<string, HttpHandler> => ({
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
  create: {
    auth: 'required',
    handle: async ({ body, auth }) => {
      if (!auth) throw new AppError('UNAUTHENTICATED');
      return {
        status: 201,
        body: { ok: true, data: await service.create(auth.sub, body as CreateFollowUpCommand) },
      };
    },
  },
});

export const registerFollowUpRoutes = (app: Express, service: FollowUpService): void => {
  mountContract(app, appContract.followUp, followUpHandlers(service));
};
