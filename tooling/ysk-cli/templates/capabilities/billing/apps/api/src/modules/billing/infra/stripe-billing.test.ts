import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createStripeBilling, verifyStripeSignature } from './stripe-billing';

describe('stripe billing', () => {
  it('creates a pending checkout session', async () => {
    const bodies: string[] = [];
    const billing = createStripeBilling({
      secretKey: 'sk_test_x',
      pricePro: 'price_pro_1',
      fetchImpl: (async (url, init) => {
        bodies.push(String(init?.body));
        expect(String(url)).toContain('/v1/checkout/sessions');
        const headers = (init?.headers ?? {}) as { authorization?: string };
        expect(headers.authorization).toBe('Bearer sk_test_x');
        return new Response(JSON.stringify({ url: 'https://checkout.stripe.com/c/pay/cs_test' }), {
          status: 200,
        });
      }) as typeof fetch,
    });
    const result = await billing.checkout({
      organizationId: '11111111-1111-4111-8111-111111111111',
      planCode: 'pro',
      successUrl: 'https://app.example/ok',
      cancelUrl: 'https://app.example/no',
      seatCount: 3,
    });
    expect(result.url).toContain('checkout.stripe.com');
    expect(result.pending).toBe(true);
    expect(bodies[0]).toContain('price_pro_1');
    expect(bodies[0]).toContain('11111111-1111-4111-8111-111111111111');
    expect(bodies[0]).toContain('line_items%5B0%5D%5Bquantity%5D=3');
    expect(bodies[0]).toContain('automatic_tax%5Benabled%5D=true');
    expect(bodies[0]).toContain('billing_address_collection=required');
  });

  it('opens a billing portal session', async () => {
    const bodies: string[] = [];
    const billing = createStripeBilling({
      secretKey: 'sk_test_x',
      pricePro: 'price_pro_1',
      fetchImpl: (async (_url, init) => {
        bodies.push(String(init?.body));
        return new Response(JSON.stringify({ url: 'https://billing.stripe.com/p/session' }), {
          status: 200,
        });
      }) as typeof fetch,
    });
    const result = await billing.portal({
      returnUrl: 'https://app.example/billing',
      customerId: 'cus_123',
    });
    expect(result.url).toContain('billing.stripe.com');
    expect(bodies[0]).toContain('cus_123');
  });

  it('maps Stripe invoices', async () => {
    const billing = createStripeBilling({
      secretKey: 'sk_test_x',
      pricePro: 'price_pro_1',
      fetchImpl: (async (url) => {
        expect(String(url)).toContain('customer=cus_123');
        return new Response(
          JSON.stringify({
            data: [
              {
                id: 'in_1',
                number: 'ABC-1',
                status: 'paid',
                amount_due: 9900,
                currency: 'hkd',
                hosted_invoice_url: 'https://invoice.stripe.com/i/1',
                created: 1_700_000_000,
              },
            ],
          }),
          { status: 200 },
        );
      }) as typeof fetch,
    });
    const rows = await billing.listInvoices({ customerId: 'cus_123' });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe('in_1');
    expect(rows[0]?.amountDue).toBe(9900);
    expect(rows[0]?.hostedInvoiceUrl).toContain('invoice.stripe.com');
  });

  it('returns invoice_pdf when the customer matches', async () => {
    const billing = createStripeBilling({
      secretKey: 'sk_test_x',
      pricePro: 'price_pro_1',
      fetchImpl: (async () =>
        new Response(
          JSON.stringify({
            customer: 'cus_123',
            invoice_pdf: 'https://files.stripe.com/invoices/in_1.pdf',
          }),
          { status: 200 },
        )) as typeof fetch,
    });
    await expect(
      billing.getInvoicePdf({ customerId: 'cus_123', invoiceId: 'in_1' }),
    ).resolves.toEqual({ url: 'https://files.stripe.com/invoices/in_1.pdf' });
    await expect(
      billing.getInvoicePdf({ customerId: 'cus_other', invoiceId: 'in_1' }),
    ).resolves.toBeNull();
  });

  it('verifies Stripe-Signature', () => {
    const secret = 'whsec_test';
    const payload = Buffer.from(
      JSON.stringify({
        type: 'checkout.session.completed',
        data: { object: { metadata: { organizationId: 'o1', planCode: 'pro', seatCount: '2' } } },
      }),
    );
    const t = '1700000000';
    const v1 = createHmac('sha256', secret)
      .update(`${t}.${payload.toString('utf8')}`)
      .digest('hex');
    const event = verifyStripeSignature(payload, `t=${t},v1=${v1}`, secret, 1_700_000_000_000);
    expect(event.type).toBe('checkout.session.completed');
    expect(() =>
      verifyStripeSignature(payload, `t=${t},v1=dead`, secret, 1_700_000_000_000),
    ).toThrow();
  });
});
