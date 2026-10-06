export type StripeWebhookEvent = {
  id: string;
  type: string;
  created: number;
  data: {
    object: {
      metadata?: Record<string, string>;
      customer?: string;
      payment_status?: string;
    };
  };
};
