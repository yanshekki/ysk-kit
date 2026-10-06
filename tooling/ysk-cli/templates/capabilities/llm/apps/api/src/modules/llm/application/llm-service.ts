import { DEFAULT_LLM_SYSTEM_PROMPT } from '@ysk-kit/config';
import type { LlmCompleteCommand, LlmCompleteDto, LlmMessage } from '@ysk-kit/contracts';
import { AppError } from '@ysk-kit/domain-kernel';
import type { ILlmPort } from '@ysk-kit/llm';
import type { ILlmUsageRepository } from '../domain/usage-repository';

export const createLlmService = (opts: {
  llm: ILlmPort;
  usage: ILlmUsageRepository;
  configured: boolean;
  production: boolean;
  systemPrompt?: string;
  quota?: { max: number; windowMs: number };
}) => {
  const systemPrompt =
    opts.systemPrompt && opts.systemPrompt.length > 0
      ? opts.systemPrompt
      : DEFAULT_LLM_SYSTEM_PROMPT;

  const withSystem = (body: LlmCompleteCommand) => {
    const messages: LlmMessage[] = [{ role: 'system', content: systemPrompt }, ...body.messages];
    return body.temperature === undefined
      ? { messages }
      : { messages, temperature: body.temperature };
  };

  const assertQuota = async (userId: string): Promise<void> => {
    const quota = opts.quota;
    if (!quota || quota.max === 0) return;
    const since = new Date(Date.now() - quota.windowMs);
    const used = await opts.usage.countSince(userId, since);
    if (used >= quota.max) throw new AppError('RATE_LIMITED');
  };

  return {
    models: () => ({ items: [{ id: opts.llm.model }] }),
    complete: async (
      userId: string,
      body: LlmCompleteCommand,
      requestId?: string,
    ): Promise<LlmCompleteDto> => {
      if (opts.production && !opts.configured) {
        throw new AppError('INTERNAL', 'LLM not configured', 503);
      }
      await assertQuota(userId);
      const result = await opts.llm.complete(withSystem(body));
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
      await assertQuota(userId);
      for await (const chunk of opts.llm.stream(withSystem(body))) {
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
  };
};

export type LlmService = ReturnType<typeof createLlmService>;
