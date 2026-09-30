import { type HttpHandler, mountContract } from '@ysk-kit/api-express';
import { appContract, type PageQuery } from '@ysk-kit/contracts';
import type { Express } from 'express';
import type { IAuditLogger } from '../domain/audit-logger';

export const auditHandlers = (audit: IAuditLogger): Record<string, HttpHandler> => ({
  list: {
    auth: 'required',
    permission: 'audit.read',
    handle: async ({ query }) => ({
      status: 200,
      body: { ok: true, data: await audit.list(query as PageQuery) },
    }),
  },
});

export const registerAuditRoutes = (app: Express, audit: IAuditLogger): void => {
  mountContract(app, appContract.audit, auditHandlers(audit));
};
