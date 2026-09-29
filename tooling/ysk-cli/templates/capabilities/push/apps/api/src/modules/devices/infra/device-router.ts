import { type HttpHandler, mountContract } from '@ysk/api-express';
import { appContract, type RegisterDeviceCommand } from '@ysk/contracts';
import { AppError } from '@ysk/domain-kernel';
import type { Express } from 'express';
import type { DeviceService } from '../application/device-service';

export const deviceHandlers = (service: DeviceService): Record<string, HttpHandler> => ({
  list: {
    auth: 'required',
    handle: async ({ auth }) => {
      if (!auth) throw new AppError('UNAUTHENTICATED');
      return { status: 200, body: { ok: true, data: await service.list(auth.sub) } };
    },
  },
  register: {
    auth: 'required',
    handle: async ({ body, auth }) => {
      if (!auth) throw new AppError('UNAUTHENTICATED');
      return {
        status: 200,
        body: { ok: true, data: await service.register(auth.sub, body as RegisterDeviceCommand) },
      };
    },
  },
  remove: {
    auth: 'required',
    handle: async ({ params, auth }) => {
      if (!auth) throw new AppError('UNAUTHENTICATED');
      return {
        status: 200,
        body: {
          ok: true,
          data: await service.remove((params as { id: string }).id, auth.sub),
        },
      };
    },
  },
});

export const registerDeviceRoutes = (app: Express, service: DeviceService): void => {
  mountContract(app, appContract.devices, deviceHandlers(service));
};
