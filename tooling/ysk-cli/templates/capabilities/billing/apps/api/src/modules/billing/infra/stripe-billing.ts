import { createHmac, timingSafeEqual } from 'node:crypto';
import type { InvoiceDto } from '@ysk-kit/contracts';
import { AppError } from '@ysk-kit/domain-kernel';
import type { IBillingPort } from '../domain/billing-port';

export const verifyStripeSignature = (
  raw: Buffer,
  header: string,
  secret: string,
  nowMs = Date.now(),
): {
  type: string;
  data: { object: { metadata?: Record<string, string>; customer?: string } };
} => {
  const parts = Object.fromEntries(
    header.split(',').map((item) => {
      const [key, ...rest] = item.split('=');
      return [key ?? '', rest.join('=')];
    }),
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) throw new AppError('UNAUTHENTICATED', 'Invalid Stripe signature');
  const age = Math.abs(nowMs - Number(timestamp) * 1000);
  if (Number.isNaN(Number(timestamp)) || age > 5 * 60 * 1000) {
    throw new AppError('UNAUTHENTICATED', 'Invalid Stripe signature');
  }
  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${raw.toString('utf8')}`)
    .digest('hex');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new AppError('UNAUTHENTICATED', 'Invalid Stripe signature');
  }
  return JSON.parse(raw.toString('utf8')) as {
    type: string;
    data: { object: { metadata?: Record<string, string>; customer?: string } };
  };
};

export const createStripeBilling = (opts: {
  secretKey: string;
  pricePro: string;
  fetchImpl?: typeof fetch;
}): IBillingPort => {
  const fetchImpl = opts.fetchImpl ?? fetch;
  return {
    requiresCustomer: true,
    async getInvoicePdf(input) {
      const res = await fetchImpl(
        `https://api.stripe.com/v1/invoices/${encodeURIComponent(input.invoiceId)}`,
        { headers: { authorization: `Bearer ${opts.secretKey}` } },
      );
      if (!res.ok) return null;
      const json = (await res.json()) as {
        customer?: string;
        invoice_pdf?: string | null;
        hosted_invoice_url?: string | null;
      };
      if (json.customer !== input.customerId) return null;
      const url = json.invoice_pdf ?? json.hosted_invoice_url;
      return url ? { url } : null;
    },
    async listInvoices(input) {
      const res = await fetchImpl(
        `https://api.stripe.com/v1/invoices?customer=${encodeURIComponent(input.customerId)}&limit=20`,
        { headers: { authorization: `Bearer ${opts.secretKey}` } },
      );
      if (!res.ok) throw new AppError('INTERNAL', 'Invoices failed');
      const json = (await res.json()) as {
        data?: Array<{
          id: string;
          number?: string | null;
          status?: string;
          amount_due?: number;
          currency?: string;
          hosted_invoice_url?: string | null;
          created?: number;
        }>;
      };
      return (json.data ?? []).map(
        (row): InvoiceDto => ({
          id: row.id,
          number: row.number ?? null,
          status: row.status ?? 'open',
          amountDue: row.amount_due ?? 0,
          currency: row.currency ?? 'hkd',
          hostedInvoiceUrl: row.hosted_invoice_url ?? null,
          createdAt: new Date((row.created ?? 0) * 1000).toISOString(),
        }),
      );
    },
    async portal(input) {
      const res = await fetchImpl('https://api.stripe.com/v1/billing_portal/sessions', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${opts.secretKey}`,
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          customer: input.customerId,
          return_url: input.returnUrl,
        }),
      });
      if (!res.ok) throw new AppError('INTERNAL', 'Portal failed');
      const json = (await res.json()) as { url?: string };
      if (!json.url) throw new AppError('INTERNAL', 'Portal failed');
      return { url: json.url };
    },
    async checkout(input) {
      if (input.planCode !== 'pro') throw new AppError('VALIDATION_FAILED', 'Unknown plan');
      const params = new URLSearchParams({
        mode: 'subscription',
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        client_reference_id: input.organizationId,
        billing_address_collection: 'required',
        'automatic_tax[enabled]': 'true',
        'line_items[0][price]': opts.pricePro,
        'line_items[0][quantity]': String(input.seatCount),
        'metadata[organizationId]': input.organizationId,
        'metadata[planCode]': input.planCode,
        'metadata[seatCount]': String(input.seatCount),
      });
      if (input.customerId) {
        params.set('customer', input.customerId);
        params.set('customer_update[address]', 'auto');
      }
      const res = await fetchImpl('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${opts.secretKey}`,
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });
      if (!res.ok) throw new AppError('INTERNAL', 'Checkout failed');
      const json = (await res.json()) as { url?: string };
      if (!json.url) throw new AppError('INTERNAL', 'Checkout failed');
      return { url: json.url, pending: true };
    },
  };
};

export const createBillingFromEnv = (
  env: {
    STRIPE_SECRET_KEY?: string | undefined;
    STRIPE_PRICE_PRO?: string | undefined;
  },
  log: IBillingPort,
): IBillingPort => {
  if (env.STRIPE_SECRET_KEY && env.STRIPE_PRICE_PRO) {
    return createStripeBilling({
      secretKey: env.STRIPE_SECRET_KEY,
      pricePro: env.STRIPE_PRICE_PRO,
    });
  }
  return log;
};
