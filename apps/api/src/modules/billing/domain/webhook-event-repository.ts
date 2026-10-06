export type ProcessedWebhookClaim = 'claimed' | 'duplicate';

export type ProcessedWebhookRecord = {
  provider: string;
  eventId: string;
  eventType: string;
  eventCreatedAt: Date;
  organizationId?: string;
};

export interface IProcessedWebhookRepository {
  tryClaim(input: ProcessedWebhookRecord): Promise<ProcessedWebhookClaim>;
  maxEventCreatedAt(
    provider: string,
    organizationId: string,
    exceptEventId: string,
  ): Promise<Date | null>;
  release(provider: string, eventId: string): Promise<void>;
}
