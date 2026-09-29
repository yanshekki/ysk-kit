import type { IBillingPort } from '../domain/billing-port';

export const createLogBilling = (
  sink: Array<{
    organizationId: string;
    planCode: string;
    seatCount: number;
    urlSuffix: string;
  }> = [],
): IBillingPort & { sink: typeof sink } => ({
  sink,
  async checkout(input) {
    const url = `https://billing.local/checkout?plan=${encodeURIComponent(input.planCode)}&seats=${input.seatCount}`;
    sink.push({
      organizationId: input.organizationId,
      planCode: input.planCode,
      seatCount: input.seatCount,
      urlSuffix: url.slice(-12),
    });
    return { url };
  },
  async portal() {
    return { url: 'https://billing.local/portal' };
  },
  async listInvoices() {
    return [];
  },
  async getInvoicePdf() {
    return null;
  },
});
