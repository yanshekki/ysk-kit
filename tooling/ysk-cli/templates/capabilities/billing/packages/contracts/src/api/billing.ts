import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  BillingPlanDtoSchema,
  CancelCommandSchema,
  CheckoutCommandSchema,
  CheckoutDtoSchema,
  InvoiceDtoSchema,
  OrganizationIdQuerySchema,
  PortalCommandSchema,
  SubscriptionDtoSchema,
} from '../dto/billing';
import { ErrSchema, OkSchema } from '../errors/envelope';

const c = initContract();

export const billingContract = c.router({
  plans: {
    method: 'GET',
    path: '/v1/billing/plans',
    responses: { 200: OkSchema(z.array(BillingPlanDtoSchema)) },
    summary: 'List billing plans',
  },
  subscription: {
    method: 'GET',
    path: '/v1/billing/subscription',
    query: OrganizationIdQuerySchema,
    responses: {
      200: OkSchema(SubscriptionDtoSchema),
      401: ErrSchema,
      403: ErrSchema,
      422: ErrSchema,
    },
    summary: 'Current organization subscription',
  },
  checkout: {
    method: 'POST',
    path: '/v1/billing/checkout',
    body: CheckoutCommandSchema,
    responses: {
      200: OkSchema(CheckoutDtoSchema),
      401: ErrSchema,
      403: ErrSchema,
      422: ErrSchema,
    },
    summary: 'Start organization checkout',
  },
  cancel: {
    method: 'POST',
    path: '/v1/billing/cancel',
    body: CancelCommandSchema,
    responses: {
      200: OkSchema(z.object({ canceled: z.literal(true) })),
      401: ErrSchema,
      403: ErrSchema,
      422: ErrSchema,
    },
    summary: 'Cancel organization subscription',
  },
  invoices: {
    method: 'GET',
    path: '/v1/billing/invoices',
    query: OrganizationIdQuerySchema,
    responses: {
      200: OkSchema(z.array(InvoiceDtoSchema)),
      401: ErrSchema,
      403: ErrSchema,
      422: ErrSchema,
    },
    summary: 'List organization invoices',
  },
  portal: {
    method: 'POST',
    path: '/v1/billing/portal',
    body: PortalCommandSchema,
    responses: {
      200: OkSchema(CheckoutDtoSchema),
      401: ErrSchema,
      403: ErrSchema,
      409: ErrSchema,
      422: ErrSchema,
    },
    summary: 'Open Stripe Customer Portal',
  },
});
