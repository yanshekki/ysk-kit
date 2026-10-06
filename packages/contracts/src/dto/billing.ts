import { z } from 'zod';
import { BillingPlanCodeSchema, SubscriptionStatusSchema } from '../enums/billing-plan.js';

export const BillingPlanDtoSchema = z.object({
  code: BillingPlanCodeSchema,
  name: z.string().min(1),
  amountHkdCents: z.number().int().nonnegative(),
  interval: z.literal('month'),
});
export type BillingPlanDto = z.infer<typeof BillingPlanDtoSchema>;

export const SubscriptionDtoSchema = z.object({
  planCode: BillingPlanCodeSchema,
  status: SubscriptionStatusSchema,
  currentPeriodEnd: z.iso.datetime().nullable(),
  seatCount: z.number().int().positive(),
});
export type SubscriptionDto = z.infer<typeof SubscriptionDtoSchema>;

export const OrganizationIdQuerySchema = z.object({
  organizationId: z.string().uuid(),
});
export type OrganizationIdQuery = z.infer<typeof OrganizationIdQuerySchema>;

export const CheckoutCommandSchema = z.object({
  organizationId: z.string().uuid(),
  planCode: BillingPlanCodeSchema,
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  seatCount: z.number().int().min(1).max(500).default(1),
});
export type CheckoutCommand = z.infer<typeof CheckoutCommandSchema>;

export const CheckoutDtoSchema = z.object({
  url: z.string().url(),
});
export type CheckoutDto = z.infer<typeof CheckoutDtoSchema>;

export const PortalCommandSchema = z.object({
  organizationId: z.string().uuid(),
  returnUrl: z.string().url(),
});
export type PortalCommand = z.infer<typeof PortalCommandSchema>;

export const CancelCommandSchema = z.object({
  organizationId: z.string().uuid(),
});
export type CancelCommand = z.infer<typeof CancelCommandSchema>;

export const InvoiceDtoSchema = z.object({
  id: z.string().min(1),
  number: z.string().nullable(),
  status: z.string().min(1),
  amountDue: z.number().int(),
  currency: z.string().min(1),
  hostedInvoiceUrl: z.string().url().nullable(),
  createdAt: z.iso.datetime(),
});
export type InvoiceDto = z.infer<typeof InvoiceDtoSchema>;
