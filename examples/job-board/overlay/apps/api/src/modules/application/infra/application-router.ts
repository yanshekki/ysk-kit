import { type HttpHandler, mountContract } from '@ysk-kit/api-express';
import { appContract, type CreateApplicationCommand, type PageQuery } from '@ysk-kit/contracts';
import { AppError } from '@ysk-kit/domain-kernel';
import type { Express } from 'express';
import type { ApplicationService } from '../application/application-service';

export const applicationHandlers = (service: ApplicationService): Record<string, HttpHandler> => ({
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
        body: {
          ok: true,
          data: await service.create(auth.sub, body as CreateApplicationCommand),
        },
      };
    },
  },
});

export const registerApplicationRoutes = (app: Express, service: ApplicationService): void => {
  mountContract(app, appContract.application, applicationHandlers(service));
};
