import { describe, expect, it } from 'vitest';
import { createFakeLlm, createOpenAiCompatibleLlm } from './index.js';

describe('llm', () => {
  it('fake complete returns canned text', async () => {
    const llm = createFakeLlm({ text: 'pong' });
    const result = await llm.complete({ messages: [{ role: 'user', content: 'ping' }] });
    expect(result.text).toBe('pong');
    expect(result.usage.totalTokens).toBeGreaterThan(0);
  });

  it('fake stream yields deltas then done', async () => {
    const llm = createFakeLlm({ text: 'pong' });
    const chunks = [];
    for await (const chunk of llm.stream({ messages: [{ role: 'user', content: 'ping' }] })) {
      chunks.push(chunk);
    }
    expect(chunks.at(-1)?.done).toBe(true);
    expect(chunks.map((c) => c.delta).join('')).toBe('pong');
  });

  it('openai-compatible complete parses usage', async () => {
    const llm = createOpenAiCompatibleLlm({
      baseUrl: 'https://api.x.ai/v1',
      apiKey: 'test',
      model: 'grok-4.7',
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            model: 'grok-4.7',
            choices: [{ message: { content: 'hi' } }],
            usage: { prompt_tokens: 2, completion_tokens: 1, total_tokens: 3 },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
    });
    const result = await llm.complete({ messages: [{ role: 'user', content: 'hey' }] });
    expect(result).toEqual({
      text: 'hi',
      model: 'grok-4.7',
      usage: { promptTokens: 2, completionTokens: 1, totalTokens: 3 },
    });
  });
});
