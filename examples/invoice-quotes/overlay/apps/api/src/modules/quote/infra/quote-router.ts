import { type HttpHandler, mountContract } from '@ysk-kit/api-express';
import { appContract, type CreateQuoteCommand, type PageQuery } from '@ysk-kit/contracts';
import { AppError } from '@ysk-kit/domain-kernel';
import type { Express } from 'express';
import type { QuoteService } from '../application/quote-service';

const idOf = (params: unknown): string => (params as { id: string }).id;

export const quoteHandlers = (service: QuoteService): Record<string, HttpHandler> => ({
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
        body: { ok: true, data: await service.create(auth.sub, body as CreateQuoteCommand) },
      };
    },
  },
  send: {
    auth: 'required',
    handle: async ({ params, auth }) => {
      if (!auth) throw new AppError('UNAUTHENTICATED');
      return {
        status: 200,
        body: { ok: true, data: await service.send(auth.sub, idOf(params)) },
      };
    },
  },
  accept: {
    auth: 'required',
    handle: async ({ params, auth }) => {
      if (!auth) throw new AppError('UNAUTHENTICATED');
      return {
        status: 200,
        body: { ok: true, data: await service.accept(auth.sub, idOf(params)) },
      };
    },
  },
});

export const registerQuoteRoutes = (app: Express, service: QuoteService): void => {
  mountContract(app, appContract.quote, quoteHandlers(service));
};
