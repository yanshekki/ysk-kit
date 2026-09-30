import { type HttpHandler, mountContract } from '@ysk-kit/api-express';
import {
  appContract,
  type CreateTicketCommand,
  type TicketListQuery,
  type UpdateTicketStatusCommand,
} from '@ysk-kit/contracts';
import { AppError } from '@ysk-kit/domain-kernel';
import type { Express } from 'express';
import type { TicketService } from '../application/ticket-service';

const idOf = (params: unknown): string => (params as { id: string }).id;

export const ticketHandlers = (service: TicketService): Record<string, HttpHandler> => ({
  list: {
    auth: 'required',
    handle: async ({ query, auth }) => {
      if (!auth) throw new AppError('UNAUTHENTICATED');
      return {
        status: 200,
        body: { ok: true, data: await service.list(auth.sub, query as TicketListQuery) },
      };
    },
  },
  create: {
    auth: 'required',
    handle: async ({ body, auth }) => {
      if (!auth) throw new AppError('UNAUTHENTICATED');
      return {
        status: 201,
        body: { ok: true, data: await service.create(auth.sub, body as CreateTicketCommand) },
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
          data: await service.status(auth.sub, idOf(params), body as UpdateTicketStatusCommand),
        },
      };
    },
  },
});

export const registerTicketRoutes = (app: Express, service: TicketService): void => {
  mountContract(app, appContract.ticket, ticketHandlers(service));
};
