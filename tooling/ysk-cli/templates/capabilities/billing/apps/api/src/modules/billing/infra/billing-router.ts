import { type HttpHandler, mountContract } from '@ysk/api-express';
import {
  appContract,
  type CancelCommand,
  type CheckoutCommand,
  type OrganizationIdQuery,
  type PortalCommand,
} from '@ysk/contracts';
import { AppError } from '@ysk/domain-kernel';
import type { Express } from 'express';
import type { BillingService } from '../application/billing-service';

const orgQuery = (query: unknown): string => (query as OrganizationIdQuery).organizationId;

export const billingHandlers = (service: BillingService): Record<string, HttpHandler> => ({
  plans: {
    handle: async () => ({ status: 200, body: { ok: true, data: service.plans() } }),
  },
  subscription: {
    auth: 'required',
    permission: 'billing.checkout',
    handle: async ({ auth, query }) => {
      if (!auth) throw new AppError('UNAUTHENTICATED');
      return {
        status: 200,
        body: { ok: true, data: await service.subscription(auth.sub, orgQuery(query)) },
      };
    },
  },
  invoices: {
    auth: 'required',
    permission: 'billing.checkout',
    handle: async ({ auth, query }) => {
      if (!auth) throw new AppError('UNAUTHENTICATED');
      return {
        status: 200,
        body: { ok: true, data: await service.invoices(auth.sub, orgQuery(query)) },
      };
    },
  },
  checkout: {
    auth: 'required',
    permission: 'billing.checkout',
    handle: async ({ body, auth }) => {
      if (!auth) throw new AppError('UNAUTHENTICATED');
      return {
        status: 200,
        body: { ok: true, data: await service.checkout(auth.sub, body as CheckoutCommand) },
      };
    },
  },
  cancel: {
    auth: 'required',
    permission: 'billing.checkout',
    handle: async ({ auth, body }) => {
      if (!auth) throw new AppError('UNAUTHENTICATED');
      return {
        status: 200,
        body: {
          ok: true,
          data: await service.cancel(auth.sub, (body as CancelCommand).organizationId),
        },
      };
    },
  },
  portal: {
    auth: 'required',
    permission: 'billing.checkout',
    handle: async ({ body, auth }) => {
      if (!auth) throw new AppError('UNAUTHENTICATED');
      const command = body as PortalCommand;
      return {
        status: 200,
        body: {
          ok: true,
          data: await service.portal(auth.sub, command.organizationId, command.returnUrl),
        },
      };
    },
  },
});

export const registerBillingRoutes = (app: Express, service: BillingService): void => {
  mountContract(app, appContract.billing, billingHandlers(service));
};
