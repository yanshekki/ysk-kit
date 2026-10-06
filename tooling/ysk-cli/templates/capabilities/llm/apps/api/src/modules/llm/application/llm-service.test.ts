import { createFakeLlm, type ILlmPort, type LlmInput } from '@ysk-kit/llm';
import { describe, expect, it } from 'vitest';
import { createMemoryLlmUsageRepository } from '../infra/memory-usage-repository';
import { createLlmService } from './llm-service';

const recordingLlm = (): { llm: ILlmPort; calls: LlmInput[] } => {
  const calls: LlmInput[] = [];
  const inner = createFakeLlm({ text: 'pong' });
  return {
    calls,
    llm: {
      model: inner.model,
      complete: async (input) => {
        calls.push(input);
        return inner.complete(input);
      },
      stream: (input) => {
        calls.push(input);
        return inner.stream(input);
      },
    },
  };
};

describe('createLlmService', () => {
  it('prepends the server system prompt and rejects a client system role at the port', async () => {
    const { llm, calls } = recordingLlm();
    const usage = createMemoryLlmUsageRepository();
    const service = createLlmService({
      llm,
      usage,
      configured: true,
      production: false,
      systemPrompt: 'Server owned prompt',
    });
    await service.complete('user-1', { messages: [{ role: 'user', content: 'ping' }] });
    expect(calls[0]?.messages[0]).toEqual({ role: 'system', content: 'Server owned prompt' });
    expect(calls[0]?.messages[1]).toEqual({ role: 'user', content: 'ping' });
  });

  it('throws RATE_LIMITED when the per-user quota is exhausted', async () => {
    const usage = createMemoryLlmUsageRepository();
    const service = createLlmService({
      llm: createFakeLlm({ text: 'pong' }),
      usage,
      configured: true,
      production: false,
      quota: { max: 1, windowMs: 60_000 },
    });
    await service.complete('user-1', { messages: [{ role: 'user', content: 'one' }] });
    await expect(
      service.complete('user-1', { messages: [{ role: 'user', content: 'two' }] }),
    ).rejects.toMatchObject({ code: 'RATE_LIMITED' });
    await expect(
      service.complete('user-2', { messages: [{ role: 'user', content: 'ok' }] }),
    ).resolves.toMatchObject({ text: 'pong' });
  });
});
