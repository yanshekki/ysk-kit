import { type HttpHandler, mountContract } from '@ysk/api-express';
import { appContract, type CreateEventCommand, type PageQuery } from '@ysk/contracts';
import { AppError } from '@ysk/domain-kernel';
import type { Express } from 'express';
import type { EventService } from '../application/event-service';

export const eventHandlers = (service: EventService): Record<string, HttpHandler> => ({
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
        body: { ok: true, data: await service.create(auth.sub, body as CreateEventCommand) },
      };
    },
  },
});

export const registerEventRoutes = (app: Express, service: EventService): void => {
  mountContract(app, appContract.event, eventHandlers(service));
};
