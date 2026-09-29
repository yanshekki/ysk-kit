import { AppError } from '@ysk/domain-kernel';
import { describe, expect, it } from 'vitest';
import { HttpClient } from './http';
import { memoryTokenStore } from './token-store';

describe('HttpClient', () => {
  it('unwraps ok envelopes', async () => {
    const http = new HttpClient({
      baseUrl: 'http://api.test',
      platform: 'web',
      tokenStore: memoryTokenStore(),
      fetchImpl: async () =>
        new Response(JSON.stringify({ ok: true, data: { status: 'ok' } }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    });
    await expect(http.request('/health')).resolves.toEqual({ status: 'ok' });
  });

  it('throws AppError from err envelopes', async () => {
    const http = new HttpClient({
      baseUrl: 'http://api.test',
      platform: 'web',
      tokenStore: memoryTokenStore(),
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            ok: false,
            error: { code: 'CONFLICT', message: 'taken', requestId: 'r1' },
          }),
          { status: 409, headers: { 'content-type': 'application/json' } },
        ),
    });
    await expect(http.request('/v1/users')).rejects.toBeInstanceOf(AppError);
  });
});
