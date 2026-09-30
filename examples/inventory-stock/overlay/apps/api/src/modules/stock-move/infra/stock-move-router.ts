import { type HttpHandler, mountContract } from '@ysk/api-express';
import { appContract, type CreateStockMoveCommand, type PageQuery } from '@ysk/contracts';
import { AppError } from '@ysk/domain-kernel';
import type { Express } from 'express';
import type { StockMoveService } from '../application/stock-move-service';

export const stockMoveHandlers = (service: StockMoveService): Record<string, HttpHandler> => ({
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
        body: { ok: true, data: await service.create(auth.sub, body as CreateStockMoveCommand) },
      };
    },
  },
});

export const registerStockMoveRoutes = (app: Express, service: StockMoveService): void => {
  mountContract(app, appContract.stockMove, stockMoveHandlers(service));
};
