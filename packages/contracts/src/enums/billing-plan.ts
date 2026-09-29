import { z } from 'zod';

export const BillingPlanCode = {
  FREE: 'free',
  PRO: 'pro',
} as const;
export type BillingPlanCode = (typeof BillingPlanCode)[keyof typeof BillingPlanCode];
export const BILLING_PLAN_CODE_VALUES = Object.values(BillingPlanCode) as [
  BillingPlanCode,
  ...BillingPlanCode[],
];
export const BillingPlanCodeSchema = z.enum(BILLING_PLAN_CODE_VALUES);

export const SubscriptionStatus = {
  ACTIVE: 'active',
  CANCELED: 'canceled',
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];
export const SUBSCRIPTION_STATUS_VALUES = Object.values(SubscriptionStatus) as [
  SubscriptionStatus,
  ...SubscriptionStatus[],
];
export const SubscriptionStatusSchema = z.enum(SUBSCRIPTION_STATUS_VALUES);

export type BillingPlan = {
  code: BillingPlanCode;
  name: string;
  amountHkdCents: number;
  interval: 'month';
};

export const BILLING_PLANS: readonly BillingPlan[] = [
  { code: 'free', name: 'Free', amountHkdCents: 0, interval: 'month' },
  { code: 'pro', name: 'Pro', amountHkdCents: 9900, interval: 'month' },
];
