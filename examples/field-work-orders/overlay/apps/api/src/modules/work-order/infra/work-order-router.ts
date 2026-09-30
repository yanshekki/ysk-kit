import { type HttpHandler, mountContract } from '@ysk-kit/api-express';
import { appContract, type CreateWorkOrderCommand, type PageQuery } from '@ysk-kit/contracts';
import { AppError } from '@ysk-kit/domain-kernel';
import type { Express } from 'express';
import type { WorkOrderService } from '../application/work-order-service';

const idOf = (params: unknown): string => (params as { id: string }).id;

export const workOrderHandlers = (service: WorkOrderService): Record<string, HttpHandler> => ({
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
        body: { ok: true, data: await service.create(auth.sub, body as CreateWorkOrderCommand) },
      };
    },
  },
  assign: {
    auth: 'required',
    handle: async ({ params, auth }) => {
      if (!auth) throw new AppError('UNAUTHENTICATED');
      return {
        status: 200,
        body: { ok: true, data: await service.assign(auth.sub, idOf(params)) },
      };
    },
  },
  complete: {
    auth: 'required',
    handle: async ({ params, auth }) => {
      if (!auth) throw new AppError('UNAUTHENTICATED');
      return {
        status: 200,
        body: { ok: true, data: await service.complete(auth.sub, idOf(params)) },
      };
    },
  },
});

export const registerWorkOrderRoutes = (app: Express, service: WorkOrderService): void => {
  mountContract(app, appContract.workOrder, workOrderHandlers(service));
};
