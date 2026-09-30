import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CancelCommand, CheckoutCommand, PortalCommand } from '@ysk-kit/contracts';
import type { YskClient } from '@ysk-kit/sdk';

export const billingQueryKey = (organizationId: string) => ['billing', organizationId] as const;

export function createBillingHooks(client: YskClient) {
  return {
    useBillingPlans: () =>
      useQuery({
        queryKey: ['billing-plans'],
        queryFn: () => client.billing.plans(),
      }),
    useSubscription: (organizationId: string, enabled = true) =>
      useQuery({
        queryKey: [...billingQueryKey(organizationId), 'subscription'],
        queryFn: () => client.billing.subscription(organizationId),
        enabled: organizationId.length > 0 && enabled,
        retry: false,
      }),
    useInvoices: (organizationId: string, enabled = true) =>
      useQuery({
        queryKey: [...billingQueryKey(organizationId), 'invoices'],
        queryFn: () => client.billing.invoices(organizationId),
        enabled: organizationId.length > 0 && enabled,
        retry: false,
      }),
    useCheckout: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (body: CheckoutCommand) => client.billing.checkout(body),
        onSuccess: (_data, body) => {
          void qc.invalidateQueries({ queryKey: billingQueryKey(body.organizationId) });
        },
      });
    },
    useBillingPortal: () =>
      useMutation({
        mutationFn: (body: PortalCommand) => client.billing.portal(body),
      }),
    useCancelSubscription: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (body: CancelCommand) => client.billing.cancel(body),
        onSuccess: (_data, body) => {
          void qc.invalidateQueries({ queryKey: billingQueryKey(body.organizationId) });
        },
      });
    },
    useInvoicePdf: () =>
      useMutation({
        mutationFn: (args: { id: string; organizationId: string }) =>
          client.billing.invoicePdfUrl(args.id, args.organizationId),
      }),
  };
}
