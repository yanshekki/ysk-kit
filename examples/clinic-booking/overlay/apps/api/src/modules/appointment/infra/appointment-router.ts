import { type HttpHandler, mountContract } from '@ysk-kit/api-express';
import { appContract, type CreateAppointmentCommand, type PageQuery } from '@ysk-kit/contracts';
import { AppError } from '@ysk-kit/domain-kernel';
import type { Express } from 'express';
import type { AppointmentService } from '../application/appointment-service';

const idOf = (params: unknown): string => (params as { id: string }).id;

export const appointmentHandlers = (service: AppointmentService): Record<string, HttpHandler> => ({
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
        body: { ok: true, data: await service.create(auth.sub, body as CreateAppointmentCommand) },
      };
    },
  },
  cancel: {
    auth: 'required',
    handle: async ({ params, auth }) => {
      if (!auth) throw new AppError('UNAUTHENTICATED');
      return {
        status: 200,
        body: { ok: true, data: await service.cancel(auth.sub, idOf(params)) },
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

export const registerAppointmentRoutes = (app: Express, service: AppointmentService): void => {
  mountContract(app, appContract.appointment, appointmentHandlers(service));
};
