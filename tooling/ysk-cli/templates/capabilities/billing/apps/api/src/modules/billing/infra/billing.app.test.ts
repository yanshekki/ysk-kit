import { createHmac } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../../app';
import { createFastifyApp } from '../../../app-fastify';
import { createMemoryInput } from '../../../create-memory-input';
import { createBillingService } from '../application/billing-service';
import { createLogBilling } from './log-billing';
import { createMemorySubscriptionRepository } from './memory-subscription-repository';
import { createMemoryWebhookEventRepository } from './memory-webhook-event-repository';
import { createStripeBilling } from './stripe-billing';

describe('billing http', () => {
  it('includes plans in OpenAPI', async () => {
    const app = createApp(createMemoryInput().input);
    const spec = await request(app).get('/openapi.json');
    expect(spec.body.paths['/v1/billing/plans']).toBeDefined();
  });

  it('activates a subscription from a signed Stripe webhook', async () => {
    const mem = createMemoryInput();
    const app = createApp(mem.input);
    const missing = await request(app).post('/v1/billing/webhook').send({});
    expect(missing.status).toBe(404);
    const secret = 'whsec_test';
    const stripeApp = createApp({ ...mem.input, stripeWebhookSecret: secret });
    const registered = await request(stripeApp).post('/v1/auth/register').send({
      email: 'stripe@ysk.hk',
      password: 'password1',
      displayName: 'Stripe',
    });
    const jwt = registered.body.data.accessToken as string;
    const org = await request(stripeApp)
      .post('/v1/organizations')
      .set('authorization', `Bearer ${jwt}`)
      .send({ name: 'Pay' });
    const organizationId = org.body.data.id as string;
    const payload = JSON.stringify({
      id: 'evt_checkout_1',
      type: 'checkout.session.completed',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          customer: 'cus_1',
          metadata: { organizationId, planCode: 'pro', seatCount: '2' },
        },
      },
    });
    const unsigned = await request(stripeApp)
      .post('/v1/billing/webhook')
      .set('content-type', 'application/json')
      .send(payload);
    expect(unsigned.status).toBe(401);
    const t = String(Math.floor(Date.now() / 1000));
    const v1 = createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex');
    const signed = await request(stripeApp)
      .post('/v1/billing/webhook')
      .set('content-type', 'application/json')
      .set('stripe-signature', `t=${t},v1=${v1}`)
      .send(payload);
    expect(signed.status).toBe(200);
    const sub = await request(stripeApp)
      .get(`/v1/billing/subscription?organizationId=${organizationId}`)
      .set('authorization', `Bearer ${jwt}`);
    expect(sub.body.data.planCode).toBe('pro');
    expect(sub.body.data.status).toBe('active');
    expect(sub.body.data.seatCount).toBe(2);
  });

  it('rejects Stripe portal before a customer exists', async () => {
    const mem = createMemoryInput();
    const billingService = createBillingService({
      subscriptions: createMemorySubscriptionRepository(),
      billing: createStripeBilling({
        secretKey: 'sk_test_x',
        pricePro: 'price_pro',
        fetchImpl: (async () => new Response('{}', { status: 500 })) as typeof fetch,
      }),
      orgs: mem.orgs,
      webhookEvents: createMemoryWebhookEventRepository(),
    });
    const stripeApp = createApp({ ...mem.input, billingService });
    const registered = await request(stripeApp).post('/v1/auth/register').send({
      email: 'portal@ysk.hk',
      password: 'password1',
      displayName: 'Portal',
    });
    const jwt = registered.body.data.accessToken as string;
    const org = await request(stripeApp)
      .post('/v1/organizations')
      .set('authorization', `Bearer ${jwt}`)
      .send({ name: 'Portal Co' });
    const denied = await request(stripeApp)
      .post('/v1/billing/portal')
      .set('authorization', `Bearer ${jwt}`)
      .send({
        organizationId: org.body.data.id,
        returnUrl: 'http://localhost:5173/billing',
      });
    expect(denied.status).toBe(409);
  });

  it('lists plans publicly and checks out a pro subscription', async () => {
    const mem = createMemoryInput();
    const app = createApp(mem.input);
    const plans = await request(app).get('/v1/billing/plans');
    expect(plans.status).toBe(200);
    expect(plans.body.data.some((row: { code: string }) => row.code === 'pro')).toBe(true);
    const denied = await request(app).post('/v1/billing/checkout').send({
      organizationId: '11111111-1111-4111-8111-111111111111',
      planCode: 'pro',
      successUrl: 'http://localhost:5173/ok',
      cancelUrl: 'http://localhost:5173/no',
    });
    expect(denied.status).toBe(401);
    const registered = await request(app).post('/v1/auth/register').send({
      email: 'pay@ysk.hk',
      password: 'password1',
      displayName: 'Pay',
    });
    const jwt = registered.body.data.accessToken as string;
    const org = await request(app)
      .post('/v1/organizations')
      .set('authorization', `Bearer ${jwt}`)
      .send({ name: 'Pay Co' });
    const organizationId = org.body.data.id as string;
    const me = await request(app)
      .get(`/v1/billing/subscription?organizationId=${organizationId}`)
      .set('authorization', `Bearer ${jwt}`);
    expect(me.body.data.planCode).toBe('free');
    expect(me.body.data.seatCount).toBe(1);
    const tooFewSeats = await request(app)
      .post('/v1/billing/checkout')
      .set('authorization', `Bearer ${jwt}`)
      .send({
        organizationId,
        planCode: 'pro',
        successUrl: 'http://localhost:5173/ok',
        cancelUrl: 'http://localhost:5173/no',
        seatCount: 0,
      });
    expect(tooFewSeats.status).toBe(422);
    const checkout = await request(app)
      .post('/v1/billing/checkout')
      .set('authorization', `Bearer ${jwt}`)
      .send({
        organizationId,
        planCode: 'pro',
        successUrl: 'http://localhost:5173/ok',
        cancelUrl: 'http://localhost:5173/no',
        seatCount: 2,
      });
    expect(checkout.status).toBe(200);
    expect(checkout.body.data.url).toContain('plan=pro');
    expect(checkout.body.data.url).toContain('seats=2');
    const sub = await request(app)
      .get(`/v1/billing/subscription?organizationId=${organizationId}`)
      .set('authorization', `Bearer ${jwt}`);
    expect(sub.body.data.planCode).toBe('pro');
    expect(sub.body.data.status).toBe('active');
    expect(sub.body.data.seatCount).toBe(2);
    const canceled = await request(app)
      .post('/v1/billing/cancel')
      .set('authorization', `Bearer ${jwt}`)
      .send({ organizationId });
    expect(canceled.status).toBe(200);
    const after = await request(app)
      .get(`/v1/billing/subscription?organizationId=${organizationId}`)
      .set('authorization', `Bearer ${jwt}`);
    expect(after.body.data.status).toBe('canceled');
    const portal = await request(app)
      .post('/v1/billing/portal')
      .set('authorization', `Bearer ${jwt}`)
      .send({ organizationId, returnUrl: 'http://localhost:5173/billing' });
    expect(portal.status).toBe(200);
    expect(portal.body.data.url).toContain('billing.local/portal');
    const invoices = await request(app)
      .get(`/v1/billing/invoices?organizationId=${organizationId}`)
      .set('authorization', `Bearer ${jwt}`);
    expect(invoices.status).toBe(200);
    expect(invoices.body.data).toEqual([]);
    const pdf = await request(app)
      .get(`/v1/billing/invoices/in_missing/pdf?organizationId=${organizationId}`)
      .set('authorization', `Bearer ${jwt}`)
      .redirects(0);
    expect(pdf.status).toBe(404);
  });

  it('forbids org MEMBER checkout and rejects seatCount below members', async () => {
    const mem = createMemoryInput();
    const app = createApp(mem.input);
    const ownerRes = await request(app).post('/v1/auth/register').send({
      email: 'bill-owner@ysk.hk',
      password: 'password1',
      displayName: 'Owner',
    });
    await request(app).post('/v1/auth/register').send({
      email: 'bill-member@ysk.hk',
      password: 'password1',
      displayName: 'Member',
    });
    const ownerToken = ownerRes.body.data.accessToken as string;
    const org = await request(app)
      .post('/v1/organizations')
      .set('authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Seats Co' });
    const organizationId = org.body.data.id as string;
    await request(app)
      .post(`/v1/organizations/${organizationId}/invites`)
      .set('authorization', `Bearer ${ownerToken}`)
      .send({ email: 'bill-member@ysk.hk', role: 'MEMBER' });
    const inviteJob = mem.jobs.find(
      (job) => job.name === 'email.send' && job.payload.vars?.inviteUrl,
    );
    const inviteToken = new URL(inviteJob?.payload.vars?.inviteUrl ?? 'http://x').searchParams.get(
      'token',
    );
    await request(app).post('/v1/organizations/invites/accept').send({ token: inviteToken });
    const memberLogin = await request(app).post('/v1/auth/login').send({
      email: 'bill-member@ysk.hk',
      password: 'password1',
    });
    const memberDenied = await request(app)
      .post('/v1/billing/checkout')
      .set('authorization', `Bearer ${memberLogin.body.data.accessToken}`)
      .send({
        organizationId,
        planCode: 'pro',
        successUrl: 'http://localhost:5173/ok',
        cancelUrl: 'http://localhost:5173/no',
        seatCount: 2,
      });
    expect(memberDenied.status).toBe(403);
    const tooFew = await request(app)
      .post('/v1/billing/checkout')
      .set('authorization', `Bearer ${ownerToken}`)
      .send({
        organizationId,
        planCode: 'pro',
        successUrl: 'http://localhost:5173/ok',
        cancelUrl: 'http://localhost:5173/no',
        seatCount: 1,
      });
    expect(tooFew.status).toBe(422);
  });

  it('redirects to an invoice PDF when the port returns a URL', async () => {
    const mem = createMemoryInput();
    const log = createLogBilling();
    const billingService = createBillingService({
      subscriptions: createMemorySubscriptionRepository(),
      billing: {
        checkout: (input) => log.checkout(input),
        portal: (input) => log.portal(input),
        listInvoices: (input) => log.listInvoices(input),
        getInvoicePdf: async () => ({ url: 'https://files.stripe.com/x.pdf' }),
      },
      orgs: mem.orgs,
      webhookEvents: createMemoryWebhookEventRepository(),
    });
    const pdfApp = createApp({ ...mem.input, billingService });
    const registered = await request(pdfApp).post('/v1/auth/register').send({
      email: 'pdf@ysk.hk',
      password: 'password1',
      displayName: 'Pdf',
    });
    const org = await mem.orgs.createWithOwner({
      name: 'Pdf Co',
      ownerUserId: registered.body.data.user.id as string,
    });
    await billingService.activate(org.id, 'pro', 'cus_1', 1);
    const pdf = await request(pdfApp)
      .get(`/v1/billing/invoices/in_1/pdf?organizationId=${org.id}`)
      .set('authorization', `Bearer ${registered.body.data.accessToken}`)
      .redirects(0);
    expect(pdf.status).toBe(302);
    expect(pdf.headers.location).toBe('https://files.stripe.com/x.pdf');
  });

  const sign = (secret: string, payload: string): string => {
    const t = String(Math.floor(Date.now() / 1000));
    const v1 = createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex');
    return `t=${t},v1=${v1}`;
  };

  it('acks a replayed Stripe event without applying it twice', async () => {
    const mem = createMemoryInput();
    const secret = 'whsec_replay';
    const app = createApp({ ...mem.input, stripeWebhookSecret: secret });
    const registered = await request(app).post('/v1/auth/register').send({
      email: 'replay@ysk.hk',
      password: 'password1',
      displayName: 'Replay',
    });
    const jwt = registered.body.data.accessToken as string;
    const org = await request(app)
      .post('/v1/organizations')
      .set('authorization', `Bearer ${jwt}`)
      .send({ name: 'Replay Co' });
    const organizationId = org.body.data.id as string;
    const payload = JSON.stringify({
      id: 'evt_replay_1',
      type: 'checkout.session.completed',
      created: 1_800_000_000,
      data: {
        object: {
          customer: 'cus_replay',
          metadata: { organizationId, planCode: 'pro', seatCount: '3' },
        },
      },
    });
    const header = sign(secret, payload);
    const first = await request(app)
      .post('/v1/billing/webhook')
      .set('content-type', 'application/json')
      .set('stripe-signature', header)
      .send(payload);
    const second = await request(app)
      .post('/v1/billing/webhook')
      .set('content-type', 'application/json')
      .set('stripe-signature', header)
      .send(payload);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body).toEqual({ ok: true, data: { received: true } });
    const sub = await request(app)
      .get(`/v1/billing/subscription?organizationId=${organizationId}`)
      .set('authorization', `Bearer ${jwt}`);
    expect(sub.body.data.seatCount).toBe(3);
  });

  it('ignores an older Stripe event after a newer one for the same org', async () => {
    const mem = createMemoryInput();
    const secret = 'whsec_order';
    const app = createApp({ ...mem.input, stripeWebhookSecret: secret });
    const registered = await request(app).post('/v1/auth/register').send({
      email: 'order@ysk.hk',
      password: 'password1',
      displayName: 'Order',
    });
    const jwt = registered.body.data.accessToken as string;
    const org = await request(app)
      .post('/v1/organizations')
      .set('authorization', `Bearer ${jwt}`)
      .send({ name: 'Order Co' });
    const organizationId = org.body.data.id as string;
    const newer = JSON.stringify({
      id: 'evt_new',
      type: 'checkout.session.completed',
      created: 1_800_000_100,
      data: {
        object: {
          customer: 'cus_new',
          metadata: { organizationId, planCode: 'pro', seatCount: '5' },
        },
      },
    });
    const older = JSON.stringify({
      id: 'evt_old',
      type: 'checkout.session.completed',
      created: 1_800_000_001,
      data: {
        object: {
          customer: 'cus_old',
          metadata: { organizationId, planCode: 'pro', seatCount: '2' },
        },
      },
    });
    const first = await request(app)
      .post('/v1/billing/webhook')
      .set('content-type', 'application/json')
      .set('stripe-signature', sign(secret, newer))
      .send(newer);
    const second = await request(app)
      .post('/v1/billing/webhook')
      .set('content-type', 'application/json')
      .set('stripe-signature', sign(secret, older))
      .send(older);
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    const sub = await request(app)
      .get(`/v1/billing/subscription?organizationId=${organizationId}`)
      .set('authorization', `Bearer ${jwt}`);
    expect(sub.body.data.seatCount).toBe(5);
  });

  it('handles a signed Stripe webhook on Fastify', async () => {
    const mem = createMemoryInput();
    const secret = 'whsec_fastify';
    const app = await createFastifyApp({ ...mem.input, stripeWebhookSecret: secret });
    const registered = await app.inject({
      method: 'POST',
      url: '/v1/auth/register',
      payload: { email: 'ff@ysk.hk', password: 'password1', displayName: 'Ff' },
    });
    const jwt = registered.json().data.accessToken as string;
    const org = await app.inject({
      method: 'POST',
      url: '/v1/organizations',
      headers: { authorization: `Bearer ${jwt}` },
      payload: { name: 'Ff Co' },
    });
    const organizationId = org.json().data.id as string;
    const payload = JSON.stringify({
      id: 'evt_fastify',
      type: 'checkout.session.completed',
      created: 1_800_000_200,
      data: {
        object: {
          customer: 'cus_ff',
          metadata: { organizationId, planCode: 'pro', seatCount: '2' },
        },
      },
    });
    const unsigned = await app.inject({
      method: 'POST',
      url: '/v1/billing/webhook',
      headers: { 'content-type': 'application/json' },
      payload,
    });
    expect(unsigned.statusCode).toBe(401);
    const signed = await app.inject({
      method: 'POST',
      url: '/v1/billing/webhook',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': sign(secret, payload),
      },
      payload,
    });
    expect(signed.statusCode).toBe(200);
    expect(signed.json()).toEqual({ ok: true, data: { received: true } });
    const replay = await app.inject({
      method: 'POST',
      url: '/v1/billing/webhook',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': sign(secret, payload),
      },
      payload,
    });
    expect(replay.statusCode).toBe(200);
    await app.close();
  });
});
