import type { LlmMessage, LlmUsage } from '@ysk-kit/contracts';

export type LlmInput = {
  messages: LlmMessage[];
  temperature?: number | undefined;
  model?: string | undefined;
};

export type LlmResult = {
  text: string;
  model: string;
  usage: LlmUsage;
};

export type LlmStreamChunk = {
  delta: string;
  done: boolean;
  usage?: LlmUsage;
};

export interface ILlmPort {
  model: string;
  complete(input: LlmInput): Promise<LlmResult>;
  stream(input: LlmInput): AsyncIterable<LlmStreamChunk>;
}

export const createFakeLlm = (opts?: { text?: string; model?: string }): ILlmPort => {
  const text = opts?.text ?? 'pong';
  const model = opts?.model ?? 'fake';
  const usage: LlmUsage = {
    promptTokens: 1,
    completionTokens: text.length,
    totalTokens: 1 + text.length,
  };
  return {
    model,
    async complete() {
      return { text, model, usage };
    },
    async *stream() {
      const mid = Math.max(1, Math.floor(text.length / 2));
      yield { delta: text.slice(0, mid), done: false };
      yield { delta: text.slice(mid), done: false };
      yield { delta: '', done: true, usage };
    },
  };
};

const toUsage = (raw: unknown): LlmUsage => {
  const u = raw as { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  const promptTokens = u?.prompt_tokens ?? 0;
  const completionTokens = u?.completion_tokens ?? 0;
  return {
    promptTokens,
    completionTokens,
    totalTokens: u?.total_tokens ?? promptTokens + completionTokens,
  };
};

export const createOpenAiCompatibleLlm = (opts: {
  baseUrl: string;
  apiKey: string;
  model: string;
  fetchImpl?: typeof fetch;
}): ILlmPort => {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const root = opts.baseUrl.replace(/\/$/, '');
  return {
    model: opts.model,
    async complete(input) {
      const res = await fetchImpl(`${root}/chat/completions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${opts.apiKey}`,
        },
        body: JSON.stringify({
          model: input.model ?? opts.model,
          messages: input.messages,
          temperature: input.temperature,
        }),
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) {
        throw new Error(`LLM HTTP ${res.status}`);
      }
      const json = (await res.json()) as {
        model?: string;
        choices?: Array<{ message?: { content?: string } }>;
        usage?: unknown;
      };
      return {
        text: json.choices?.[0]?.message?.content ?? '',
        model: json.model ?? opts.model,
        usage: toUsage(json.usage),
      };
    },
    async *stream(input) {
      const res = await fetchImpl(`${root}/chat/completions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${opts.apiKey}`,
        },
        body: JSON.stringify({
          model: input.model ?? opts.model,
          messages: input.messages,
          temperature: input.temperature,
          stream: true,
          stream_options: { include_usage: true },
        }),
      });
      if (!res.ok || !res.body) {
        throw new Error(`LLM HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let usage: LlmUsage | undefined;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') {
            yield { delta: '', done: true, ...(usage ? { usage } : {}) };
            return;
          }
          try {
            const json = JSON.parse(data) as {
              choices?: Array<{ delta?: { content?: string } }>;
              usage?: unknown;
            };
            if (json.usage) usage = toUsage(json.usage);
            const delta = json.choices?.[0]?.delta?.content ?? '';
            if (delta) yield { delta, done: false };
          } catch {
            /* ignore partial JSON */
          }
        }
      }
      yield { delta: '', done: true, ...(usage ? { usage } : {}) };
    },
  };
};

export const createLlmFromEnv = (env: {
  NODE_ENV: string;
  LLM_BASE_URL?: string | undefined;
  LLM_API_KEY?: string | undefined;
  XAI_API_KEY?: string | undefined;
  LLM_MODEL?: string | undefined;
}): ILlmPort => {
  const apiKey = env.LLM_API_KEY || env.XAI_API_KEY;
  const model = env.LLM_MODEL && env.LLM_MODEL.length > 0 ? env.LLM_MODEL : 'grok-4.7';
  if (apiKey) {
    return createOpenAiCompatibleLlm({
      baseUrl:
        env.LLM_BASE_URL && env.LLM_BASE_URL.length > 0 ? env.LLM_BASE_URL : 'https://api.x.ai/v1',
      apiKey,
      model,
    });
  }
  return createFakeLlm({ model });
};
