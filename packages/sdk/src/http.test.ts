import { AppError } from '@ysk-kit/domain-kernel';
import { describe, expect, it } from 'vitest';
import { HttpClient } from './http.js';
import { memoryTokenStore } from './token-store.js';

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

  it('returns a 302 Location for invoice PDFs', async () => {
    const http = new HttpClient({
      baseUrl: 'http://api.test',
      platform: 'web',
      tokenStore: memoryTokenStore(),
      fetchImpl: async () =>
        new Response(null, { status: 302, headers: { location: 'https://files.test/a.pdf' } }),
    });
    await expect(http.requestLocation('/v1/billing/invoices/1/pdf')).resolves.toBe(
      'https://files.test/a.pdf',
    );
  });

  it('refreshes once on UNAUTHENTICATED', async () => {
    const store = memoryTokenStore();
    await store.setPair?.('old', 'refresh-1');
    let calls = 0;
    const http = new HttpClient({
      baseUrl: 'http://api.test',
      platform: 'web',
      tokenStore: store,
      fetchImpl: async (input) => {
        const url = String(input);
        calls += 1;
        if (url.endsWith('/v1/auth/refresh')) {
          return new Response(
            JSON.stringify({
              ok: true,
              data: { accessToken: 'new', refreshToken: 'refresh-2' },
            }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          );
        }
        if (calls === 1) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: { code: 'UNAUTHENTICATED', message: 'expired', requestId: 'r1' },
            }),
            { status: 401, headers: { 'content-type': 'application/json' } },
          );
        }
        return new Response(JSON.stringify({ ok: true, data: { ok: true } }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      },
    });
    await expect(http.request('/v1/users')).resolves.toEqual({ ok: true });
    expect(await store.get()).toBe('new');
  });
});
