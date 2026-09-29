import type { BillingPlanCode, SubscriptionStatus } from '@ysk/contracts';
import type { PrismaClient } from '../../../generated/prisma/client';
import type {
  ISubscriptionRepository,
  SubscriptionRecord,
} from '../domain/subscription-repository';

const toRecord = (row: {
  id: string;
  organizationId: string;
  planCode: string;
  status: string;
  currentPeriodEnd: Date | null;
  seatCount: number;
  createdAt: Date;
}): SubscriptionRecord => ({
  id: row.id,
  organizationId: row.organizationId,
  planCode: row.planCode as BillingPlanCode,
  status: row.status as SubscriptionStatus,
  currentPeriodEnd: row.currentPeriodEnd,
  seatCount: row.seatCount,
  createdAt: row.createdAt,
});

export const createPrismaSubscriptionRepository = (
  prisma: PrismaClient,
): ISubscriptionRepository => ({
  async findByOrganizationId(organizationId) {
    const row = await prisma.subscription.findUnique({ where: { organizationId } });
    return row ? toRecord(row) : null;
  },
  async upsert(input) {
    const row = await prisma.subscription.upsert({
      where: { organizationId: input.organizationId },
      create: {
        organizationId: input.organizationId,
        planCode: input.planCode,
        status: input.status,
        currentPeriodEnd: input.currentPeriodEnd,
        seatCount: input.seatCount,
      },
      update: {
        planCode: input.planCode,
        status: input.status,
        currentPeriodEnd: input.currentPeriodEnd,
        seatCount: input.seatCount,
      },
    });
    return toRecord(row);
  },
});
