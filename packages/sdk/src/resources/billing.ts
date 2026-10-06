import type {
  BillingPlanDto,
  CancelCommand,
  CheckoutCommand,
  CheckoutDto,
  InvoiceDto,
  PortalCommand,
  SubscriptionDto,
} from '@ysk-kit/contracts';
import type { HttpClient } from '../http.js';

const withOrg = (path: string, organizationId: string): string =>
  `${path}?organizationId=${encodeURIComponent(organizationId)}`;

export const billingResource = (http: HttpClient) => ({
  plans: () => http.request<BillingPlanDto[]>('/v1/billing/plans'),
  subscription: (organizationId: string) =>
    http.request<SubscriptionDto>(withOrg('/v1/billing/subscription', organizationId)),
  invoices: (organizationId: string) =>
    http.request<InvoiceDto[]>(withOrg('/v1/billing/invoices', organizationId)),
  invoicePdfUrl: (id: string, organizationId: string) =>
    http.requestLocation(withOrg(`/v1/billing/invoices/${id}/pdf`, organizationId)),
  checkout: (body: CheckoutCommand) =>
    http.request<CheckoutDto>('/v1/billing/checkout', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  cancel: (body: CancelCommand) =>
    http.request<{ canceled: true }>('/v1/billing/cancel', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  portal: (body: PortalCommand) =>
    http.request<CheckoutDto>('/v1/billing/portal', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
});
