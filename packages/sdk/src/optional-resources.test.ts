import { describe, expect, it } from 'vitest';
import { createYskClient } from './index';
import { memoryTokenStore } from './token-store';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify({ ok: true, data }), {
    status,
    headers: { 'content-type': 'application/json' },
  });

describe('optional sdk resources', () => {
  it('calls devices, billing, organizations, llm', async () => {
    const seen: string[] = [];
    const client = createYskClient({
      baseUrl: 'http://api.test',
      platform: 'web',
      tokenStore: memoryTokenStore(),
      fetchImpl: async (input, init) => {
        const url = String(input);
        seen.push(`${init?.method ?? 'GET'} ${url}`);
        if (url.includes('/v1/llm/complete')) {
          return json({
            text: 'hi',
            model: 'grok-4.7',
            usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
          });
        }
        return json({ items: [], nextCursor: null });
      },
    });
    await client.devices.list();
    await client.billing.plans();
    await client.organizations.list();
    await client.llm.complete({ messages: [{ role: 'user', content: 'hi' }] });
    expect(seen.some((row) => row.includes('/v1/me/devices'))).toBe(true);
    expect(seen.some((row) => row.includes('/v1/billing/plans'))).toBe(true);
    expect(seen.some((row) => row.includes('/v1/organizations'))).toBe(true);
    expect(seen.some((row) => row.includes('/v1/llm/complete'))).toBe(true);
  });
});
