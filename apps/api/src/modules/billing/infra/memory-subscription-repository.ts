import type {
  ISubscriptionRepository,
  SubscriptionRecord,
} from '../domain/subscription-repository';

export const createMemorySubscriptionRepository = (): ISubscriptionRepository => {
  const rows = new Map<string, SubscriptionRecord>();
  return {
    async findByOrganizationId(organizationId) {
      return rows.get(organizationId) ?? null;
    },
    async upsert(input) {
      const existing = rows.get(input.organizationId);
      const row: SubscriptionRecord = {
        id: existing?.id ?? crypto.randomUUID(),
        createdAt: existing?.createdAt ?? new Date(),
        organizationId: input.organizationId,
        planCode: input.planCode,
        status: input.status,
        currentPeriodEnd: input.currentPeriodEnd,
        seatCount: input.seatCount,
      };
      rows.set(input.organizationId, row);
      return row;
    },
  };
};
