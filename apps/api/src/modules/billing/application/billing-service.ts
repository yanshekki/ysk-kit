import type { CheckoutCommand, SubscriptionDto } from '@ysk/contracts';
import { BILLING_PLANS, orgRoleCan } from '@ysk/contracts';
import { AppError } from '@ysk/domain-kernel';
import type { IOrganizationRepository } from '../../organizations/domain/organization-repository';
import type { IBillingPort } from '../domain/billing-port';
import type { ISubscriptionRepository } from '../domain/subscription-repository';

const PERIOD_MS = 1000 * 60 * 60 * 24 * 30;

const freeSub = (): SubscriptionDto => ({
  planCode: 'free',
  status: 'active',
  currentPeriodEnd: null,
  seatCount: 1,
});

const toDto = (row: {
  planCode: SubscriptionDto['planCode'];
  status: SubscriptionDto['status'];
  currentPeriodEnd: Date | null;
  seatCount: number;
}): SubscriptionDto => ({
  planCode: row.planCode,
  status: row.status,
  currentPeriodEnd: row.currentPeriodEnd ? row.currentPeriodEnd.toISOString() : null,
  seatCount: row.seatCount,
});

export const createBillingService = (opts: {
  subscriptions: ISubscriptionRepository;
  billing: IBillingPort;
  orgs: IOrganizationRepository;
  now?: () => Date;
}) => {
  const now = () => opts.now?.() ?? new Date();

  const requireBiller = async (userId: string, organizationId: string) => {
    const org = await opts.orgs.findById(organizationId);
    if (!org) throw new AppError('NOT_FOUND');
    const membership = await opts.orgs.findMembership(organizationId, userId);
    if (!membership || !orgRoleCan(membership.role, 'org.billing')) {
      throw new AppError('FORBIDDEN');
    }
    return org;
  };

  return {
    plans: () => BILLING_PLANS,
    subscription: async (userId: string, organizationId: string): Promise<SubscriptionDto> => {
      await requireBiller(userId, organizationId);
      const row = await opts.subscriptions.findByOrganizationId(organizationId);
      return row ? toDto(row) : freeSub();
    },
    invoices: async (userId: string, organizationId: string) => {
      const org = await requireBiller(userId, organizationId);
      if (!org.stripeCustomerId) return [];
      return opts.billing.listInvoices({ customerId: org.stripeCustomerId });
    },
    invoicePdf: async (userId: string, organizationId: string, invoiceId: string) => {
      const org = await requireBiller(userId, organizationId);
      if (!org.stripeCustomerId) return null;
      return opts.billing.getInvoicePdf({
        customerId: org.stripeCustomerId,
        invoiceId,
      });
    },
    activate: async (
      organizationId: string,
      planCode: SubscriptionDto['planCode'],
      customerId?: string,
      seatCount = 1,
    ) => {
      if (planCode === 'free') return;
      const org = await opts.orgs.findById(organizationId);
      if (!org) throw new AppError('NOT_FOUND');
      await opts.subscriptions.upsert({
        organizationId,
        planCode,
        status: 'active',
        currentPeriodEnd: new Date(now().getTime() + PERIOD_MS),
        seatCount,
      });
      if (customerId) await opts.orgs.setStripeCustomerId(organizationId, customerId);
    },
    portal: async (userId: string, organizationId: string, returnUrl: string) => {
      const org = await requireBiller(userId, organizationId);
      const customerId = org.stripeCustomerId;
      if (opts.billing.requiresCustomer && !customerId) {
        throw new AppError('CONFLICT', 'Complete checkout first');
      }
      return opts.billing.portal({
        returnUrl,
        customerId: customerId ?? 'cus_stub',
      });
    },
    checkout: async (userId: string, body: CheckoutCommand) => {
      if (body.planCode === 'free') throw new AppError('VALIDATION_FAILED', 'Cannot checkout free');
      await requireBiller(userId, body.organizationId);
      const members = await opts.orgs.listMembers(body.organizationId);
      if (body.seatCount < members.length) {
        throw new AppError('VALIDATION_FAILED', 'seatCount below member count');
      }
      const org = await opts.orgs.findById(body.organizationId);
      const result = await opts.billing.checkout({
        organizationId: body.organizationId,
        planCode: body.planCode,
        successUrl: body.successUrl,
        cancelUrl: body.cancelUrl,
        seatCount: body.seatCount,
        ...(org?.stripeCustomerId ? { customerId: org.stripeCustomerId } : {}),
      });
      if (!result.pending) {
        await opts.subscriptions.upsert({
          organizationId: body.organizationId,
          planCode: body.planCode,
          status: 'active',
          currentPeriodEnd: new Date(now().getTime() + PERIOD_MS),
          seatCount: body.seatCount,
        });
      }
      return { url: result.url };
    },
    cancel: async (userId: string, organizationId: string) => {
      await requireBiller(userId, organizationId);
      const row = await opts.subscriptions.findByOrganizationId(organizationId);
      if (row) {
        await opts.subscriptions.upsert({
          organizationId,
          planCode: row.planCode,
          status: 'canceled',
          currentPeriodEnd: row.currentPeriodEnd,
          seatCount: row.seatCount,
        });
      }
      return { canceled: true as const };
    },
  };
};

export type BillingService = ReturnType<typeof createBillingService>;
