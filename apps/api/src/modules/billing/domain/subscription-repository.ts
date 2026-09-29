import type { BillingPlanCode, SubscriptionStatus } from '@ysk/contracts';

export type SubscriptionRecord = {
  id: string;
  organizationId: string;
  planCode: BillingPlanCode;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  seatCount: number;
  createdAt: Date;
};

export interface ISubscriptionRepository {
  findByOrganizationId(organizationId: string): Promise<SubscriptionRecord | null>;
  upsert(input: {
    organizationId: string;
    planCode: BillingPlanCode;
    status: SubscriptionStatus;
    currentPeriodEnd: Date | null;
    seatCount: number;
  }): Promise<SubscriptionRecord>;
}
