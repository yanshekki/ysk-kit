import type { PrismaClient } from '../../../generated/prisma/client';
import type { IProcessedWebhookRepository } from '../domain/webhook-event-repository';

export const createPrismaWebhookEventRepository = (
  prisma: PrismaClient,
): IProcessedWebhookRepository => ({
  async tryClaim(input) {
    try {
      await prisma.processedWebhookEvent.create({
        data: {
          provider: input.provider,
          eventId: input.eventId,
          eventType: input.eventType,
          eventCreatedAt: input.eventCreatedAt,
          ...(input.organizationId ? { organizationId: input.organizationId } : {}),
        },
      });
      return 'claimed';
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code?: unknown }).code)
          : '';
      if (code === 'P2002') return 'duplicate';
      throw error;
    }
  },
  async maxEventCreatedAt(provider, organizationId, exceptEventId) {
    const row = await prisma.processedWebhookEvent.findFirst({
      where: { provider, organizationId, eventId: { not: exceptEventId } },
      orderBy: { eventCreatedAt: 'desc' },
      select: { eventCreatedAt: true },
    });
    return row?.eventCreatedAt ?? null;
  },
  async release(provider, eventId) {
    await prisma.processedWebhookEvent.deleteMany({ where: { provider, eventId } });
  },
});
