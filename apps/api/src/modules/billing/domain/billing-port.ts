export type CheckoutInput = {
  organizationId: string;
  planCode: string;
  successUrl: string;
  cancelUrl: string;
  seatCount: number;
  customerId?: string;
};

export type CheckoutResult = {
  url: string;
  pending?: true;
};

import type { InvoiceDto } from '@ysk-kit/contracts';

export interface IBillingPort {
  checkout(input: CheckoutInput): Promise<CheckoutResult>;
  portal(input: { returnUrl: string; customerId: string }): Promise<{ url: string }>;
  listInvoices(input: { customerId: string }): Promise<InvoiceDto[]>;
  getInvoicePdf(input: { customerId: string; invoiceId: string }): Promise<{ url: string } | null>;
  requiresCustomer?: true;
}
