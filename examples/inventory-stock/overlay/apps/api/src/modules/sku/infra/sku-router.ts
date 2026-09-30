import { type HttpHandler, mountContract } from '@ysk/api-express';
import { appContract, type CreateSkuCommand, type PageQuery } from '@ysk/contracts';
import { AppError } from '@ysk/domain-kernel';
import type { Express } from 'express';
import type { SkuService } from '../application/sku-service';

export const skuHandlers = (service: SkuService): Record<string, HttpHandler> => ({
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
        body: { ok: true, data: await service.create(auth.sub, body as CreateSkuCommand) },
      };
    },
  },
});

export const registerSkuRoutes = (app: Express, service: SkuService): void => {
  mountContract(app, appContract.sku, skuHandlers(service));
};
