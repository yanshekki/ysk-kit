import { type HttpHandler, mountContract } from '@ysk-kit/api-express';
import { appContract, type CreateApiKeyCommand } from '@ysk-kit/contracts';
import { AppError } from '@ysk-kit/domain-kernel';
import type { Express } from 'express';
import type { ApiKeyService } from '../application/api-key-service';

export const apiKeyHandlers = (service: ApiKeyService): Record<string, HttpHandler> => ({
  list: {
    auth: 'required',
    handle: async ({ auth }) => {
      if (!auth) throw new AppError('UNAUTHENTICATED');
      return { status: 200, body: { ok: true, data: await service.list(auth) } };
    },
  },
  create: {
    auth: 'required',
    handle: async ({ body, auth }) => {
      if (!auth) throw new AppError('UNAUTHENTICATED');
      return {
        status: 201,
        body: { ok: true, data: await service.create(auth, body as CreateApiKeyCommand) },
      };
    },
  },
  revoke: {
    auth: 'required',
    handle: async ({ params, auth }) => {
      if (!auth) throw new AppError('UNAUTHENTICATED');
      return {
        status: 200,
        body: { ok: true, data: await service.revoke(auth, (params as { id: string }).id) },
      };
    },
  },
});

export const registerApiKeyRoutes = (app: Express, service: ApiKeyService): void => {
  mountContract(app, appContract.apiKeys, apiKeyHandlers(service));
};
