import type { LlmUsage } from '@ysk-kit/contracts';

export interface ILlmUsageRepository {
  create(input: {
    userId: string;
    model: string;
    usage: LlmUsage;
    requestId?: string | undefined;
  }): Promise<void>;
}
