import { type HttpHandler, mountContract } from '@ysk/api-express';
import {
  appContract,
  type CreateContactCommand,
  type PageQuery,
  type UpdateContactStatusCommand,
} from '@ysk/contracts';
import { AppError } from '@ysk/domain-kernel';
import type { Express } from 'express';
import type { ContactService } from '../application/contact-service';

const idOf = (params: unknown): string => (params as { id: string }).id;

export const contactHandlers = (service: ContactService): Record<string, HttpHandler> => ({
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
        body: { ok: true, data: await service.create(auth.sub, body as CreateContactCommand) },
      };
    },
  },
  status: {
    auth: 'required',
    handle: async ({ params, body, auth }) => {
      if (!auth) throw new AppError('UNAUTHENTICATED');
      return {
        status: 200,
        body: {
          ok: true,
          data: await service.status(auth.sub, idOf(params), body as UpdateContactStatusCommand),
        },
      };
    },
  },
});

export const registerContactRoutes = (app: Express, service: ContactService): void => {
  mountContract(app, appContract.contact, contactHandlers(service));
};
