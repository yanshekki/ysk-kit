import { type HttpHandler, mountContract } from '@ysk/api-express';
import { appContract, type CreateJobCommand, type PageQuery } from '@ysk/contracts';
import { AppError } from '@ysk/domain-kernel';
import type { Express } from 'express';
import type { JobService } from '../application/job-service';

const idOf = (params: unknown): string => (params as { id: string }).id;

export const jobHandlers = (service: JobService): Record<string, HttpHandler> => ({
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
        body: { ok: true, data: await service.create(auth.sub, body as CreateJobCommand) },
      };
    },
  },
  publish: {
    auth: 'required',
    handle: async ({ params, auth }) => {
      if (!auth) throw new AppError('UNAUTHENTICATED');
      return {
        status: 200,
        body: { ok: true, data: await service.publish(auth.sub, idOf(params)) },
      };
    },
  },
});

export const registerJobRoutes = (app: Express, service: JobService): void => {
  mountContract(app, appContract.job, jobHandlers(service));
};
