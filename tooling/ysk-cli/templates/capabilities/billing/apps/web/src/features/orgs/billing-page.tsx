import { BILLING_PLANS } from '@ysk/contracts';
import {
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ysk/ui';
import { formatHkd, orgRoleCan } from '@ysk/ui-logic';
import { createBillingHooks, createOrganizationHooks } from '@ysk/web-sdk';
import { type FormEvent, useState } from 'react';
import { api, userHooks } from '../../lib/client';

const orgHooks = createOrganizationHooks(api);
const billingHooks = createBillingHooks(api);

export function BillingPage({ organizationId }: { organizationId: string }) {
  const me = userHooks.useMe();
  const members = orgHooks.useOrganizationMembers(organizationId);
  const myRole = members.data?.find((row) => row.userId === me.data?.id)?.role;
  const canBill = myRole ? orgRoleCan(myRole, 'org.billing') : false;
  const subscription = billingHooks.useSubscription(organizationId, canBill);
  const invoices = billingHooks.useInvoices(organizationId, canBill);
  const checkout = billingHooks.useCheckout();
  const portal = billingHooks.useBillingPortal();
  const cancel = billingHooks.useCancelSubscription();
  const invoicePdf = billingHooks.useInvoicePdf();
  const [seatCount, setSeatCount] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);

  const onCheckout = (event: FormEvent) => {
    event.preventDefault();
    const pageUrl = `${window.location.origin}/orgs/${organizationId}/billing`;
    setFormError(null);
    checkout.mutate(
      {
        organizationId,
        planCode: 'pro',
        successUrl: pageUrl,
        cancelUrl: pageUrl,
        seatCount,
      },
      {
        onSuccess: (data) => {
          window.location.assign(data.url);
        },
        onError: (error) => setFormError(error.message),
      },
    );
  };

  if (members.isPending) {
    return (
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-zinc-600">Loading…</p>
      </section>
    );
  }

  if (!canBill) {
    return (
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-zinc-600">Billing is for organization owners and admins.</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Billing</h1>
      {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
      <p className="text-sm text-zinc-600">
        Plan {subscription.data?.planCode ?? 'free'} · {subscription.data?.seatCount ?? 1} seats
        {subscription.data?.currentPeriodEnd
          ? ` · period ends ${subscription.data.currentPeriodEnd}`
          : ''}
      </p>
      <ul className="text-sm text-zinc-600">
        {BILLING_PLANS.map((plan) => (
          <li key={plan.code}>
            {plan.name} · {formatHkd(plan.amountHkdCents / 100)} / {plan.interval}
          </li>
        ))}
      </ul>
      <form onSubmit={onCheckout} className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm" htmlFor="seat-count">
          Seats
          <Input
            id="seat-count"
            type="number"
            min={1}
            max={500}
            value={seatCount}
            onChange={(e) => setSeatCount(Number(e.target.value))}
            required
          />
        </label>
        <Button type="submit" disabled={checkout.isPending}>
          Checkout Pro
        </Button>
      </form>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={portal.isPending}
          onClick={() =>
            portal.mutate(
              {
                organizationId,
                returnUrl: `${window.location.origin}/orgs/${organizationId}/billing`,
              },
              {
                onSuccess: (data) => {
                  window.location.assign(data.url);
                },
                onError: (error) => setFormError(error.message),
              },
            )
          }
        >
          Customer portal
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={cancel.isPending}
          onClick={() => {
            if (!window.confirm('Cancel this subscription?')) return;
            cancel.mutate({ organizationId }, { onError: (error) => setFormError(error.message) });
          }}
        >
          Cancel
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {(invoices.data ?? []).map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell>{invoice.number ?? invoice.id}</TableCell>
              <TableCell>{invoice.status}</TableCell>
              <TableCell>{formatHkd(invoice.amountDue / 100)}</TableCell>
              <TableCell>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={invoicePdf.isPending}
                  onClick={() =>
                    invoicePdf.mutate(
                      { id: invoice.id, organizationId },
                      {
                        onSuccess: (url) => {
                          window.location.assign(url);
                        },
                        onError: (error) => setFormError(error.message),
                      },
                    )
                  }
                >
                  PDF
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
