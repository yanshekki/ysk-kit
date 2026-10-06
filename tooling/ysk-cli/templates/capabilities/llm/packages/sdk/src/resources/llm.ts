import type {
  LlmCompleteCommand,
  LlmCompleteDto,
  LlmModelsDto,
  LlmUsage,
  Platform,
} from '@ysk-kit/contracts';
import type { HttpClient } from '../http.js';
import type { TokenStore } from '../token-store.js';

export const llmResource = (
  http: HttpClient,
  ctx: { baseUrl: string; platform: Platform; tokenStore: TokenStore; fetchImpl?: typeof fetch },
) => ({
  complete: (body: LlmCompleteCommand) =>
    http.request<LlmCompleteDto>('/v1/llm/complete', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  models: () => http.request<LlmModelsDto>('/v1/llm/models'),
  stream: async (
    body: LlmCompleteCommand,
    handlers: {
      onDelta: (delta: string) => void;
      onDone: (usage?: LlmUsage) => void;
      onError?: (message: string) => void;
    },
  ) => {
    const fetchImpl = ctx.fetchImpl ?? fetch;
    const token = await ctx.tokenStore.get();
    const headers = new Headers({
      'content-type': 'application/json',
      'x-ysk-platform': ctx.platform,
    });
    if (token) headers.set('authorization', `Bearer ${token}`);
    const res = await fetchImpl(`${ctx.baseUrl}/v1/llm/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok || !res.body) {
      handlers.onError?.(`HTTP ${res.status}`);
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';
      for (const part of parts) {
        const eventLine = part.split('\n').find((line) => line.startsWith('event:'));
        const dataLine = part.split('\n').find((line) => line.startsWith('data:'));
        if (!dataLine) continue;
        const json = JSON.parse(dataLine.slice(5).trim()) as {
          delta?: string;
          done?: boolean;
          usage?: LlmUsage;
        };
        if (eventLine?.includes('done') || json.done) handlers.onDone(json.usage);
        else if (json.delta) handlers.onDelta(json.delta);
      }
    }
  },
});
