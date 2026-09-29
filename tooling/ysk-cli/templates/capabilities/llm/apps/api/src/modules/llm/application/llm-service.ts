import type { LlmCompleteCommand, LlmCompleteDto } from '@ysk/contracts';
import { AppError } from '@ysk/domain-kernel';
import type { ILlmPort } from '@ysk/llm';
import type { ILlmUsageRepository } from '../domain/usage-repository';

export const createLlmService = (opts: {
  llm: ILlmPort;
  usage: ILlmUsageRepository;
  configured: boolean;
  production: boolean;
}) => ({
  models: () => ({ items: [{ id: opts.llm.model }] }),
  complete: async (
    userId: string,
    body: LlmCompleteCommand,
    requestId?: string,
  ): Promise<LlmCompleteDto> => {
    if (opts.production && !opts.configured) {
      throw new AppError('INTERNAL', 'LLM not configured', 503);
    }
    const result = await opts.llm.complete(body);
    await opts.usage.create({
      userId,
      model: result.model,
      usage: result.usage,
      requestId,
    });
    return result;
  },
  stream: async function* (userId: string, body: LlmCompleteCommand, requestId?: string) {
    if (opts.production && !opts.configured) {
      throw new AppError('INTERNAL', 'LLM not configured', 503);
    }
    for await (const chunk of opts.llm.stream(body)) {
      if (chunk.done && chunk.usage) {
        await opts.usage.create({
          userId,
          model: opts.llm.model,
          usage: chunk.usage,
          requestId,
        });
      }
      yield chunk;
    }
  },
});

export type LlmService = ReturnType<typeof createLlmService>;
