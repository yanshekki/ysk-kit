import type {
  IProcessedWebhookRepository,
  ProcessedWebhookRecord,
} from '../domain/webhook-event-repository';

const keyOf = (provider: string, eventId: string): string => `${provider}:${eventId}`;

export const createMemoryWebhookEventRepository = (): IProcessedWebhookRepository => {
  const rows = new Map<string, ProcessedWebhookRecord>();
  return {
    async tryClaim(input) {
      const key = keyOf(input.provider, input.eventId);
      if (rows.has(key)) return 'duplicate';
      rows.set(key, input);
      return 'claimed';
    },
    async maxEventCreatedAt(provider, organizationId, exceptEventId) {
      let latest: Date | null = null;
      for (const row of rows.values()) {
        if (row.provider !== provider) continue;
        if (row.organizationId !== organizationId) continue;
        if (row.eventId === exceptEventId) continue;
        if (!latest || row.eventCreatedAt > latest) latest = row.eventCreatedAt;
      }
      return latest;
    },
    async release(provider, eventId) {
      rows.delete(keyOf(provider, eventId));
    },
  };
};
