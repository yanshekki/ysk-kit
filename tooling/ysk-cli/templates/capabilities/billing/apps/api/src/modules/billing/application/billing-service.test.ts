import { describe, expect, it } from 'vitest';
import { createMemoryOrganizationRepository } from '../../organizations/infra/memory-organization-repository';
import { createLogBilling } from '../infra/log-billing';
import { createMemorySubscriptionRepository } from '../infra/memory-subscription-repository';
import { createMemoryWebhookEventRepository } from '../infra/memory-webhook-event-repository';
import { createBillingService } from './billing-service';

describe('createBillingService webhooks', () => {
  it('activates once and skips a replay plus a stale event', async () => {
    const orgs = createMemoryOrganizationRepository();
    const subscriptions = createMemorySubscriptionRepository();
    const service = createBillingService({
      subscriptions,
      billing: createLogBilling(),
      orgs,
      webhookEvents: createMemoryWebhookEventRepository(),
    });
    const owner = await orgs.createWithOwner({ name: 'Pay', ownerUserId: 'user-1' });
    await service.handleStripeEvent({
      id: 'evt_new',
      type: 'checkout.session.completed',
      created: 100,
      data: {
        object: {
          customer: 'cus_1',
          metadata: { organizationId: owner.id, planCode: 'pro', seatCount: '4' },
        },
      },
    });
    await service.handleStripeEvent({
      id: 'evt_new',
      type: 'checkout.session.completed',
      created: 100,
      data: {
        object: {
          customer: 'cus_1',
          metadata: { organizationId: owner.id, planCode: 'pro', seatCount: '4' },
        },
      },
    });
    await service.handleStripeEvent({
      id: 'evt_old',
      type: 'checkout.session.completed',
      created: 50,
      data: {
        object: {
          customer: 'cus_1',
          metadata: { organizationId: owner.id, planCode: 'pro', seatCount: '1' },
        },
      },
    });
    const row = await subscriptions.findByOrganizationId(owner.id);
    expect(row?.seatCount).toBe(4);
    expect(row?.status).toBe('active');
  });
});
