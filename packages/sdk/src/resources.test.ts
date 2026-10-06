import { describe, expect, it } from 'vitest';
import { createYskClient } from './index.js';
import { memoryTokenStore } from './token-store.js';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify({ ok: true, data }), {
    status,
    headers: { 'content-type': 'application/json' },
  });

describe('sdk resources', () => {
  it('calls users, notifications, api-keys, audit, auth', async () => {
    const seen: string[] = [];
    const client = createYskClient({
      baseUrl: 'http://api.test',
      platform: 'web',
      tokenStore: memoryTokenStore(),
      fetchImpl: async (input, init) => {
        const url = String(input);
        seen.push(`${init?.method ?? 'GET'} ${url}`);
        if (url.includes('/v1/auth/login')) {
          return json({ accessToken: 'a', refreshToken: 'r', user: { id: '1' } });
        }
        if (url.includes('/v1/auth/logout')) return json({ ok: true });
        if (url.includes('/v1/me/api-keys') && init?.method === 'POST') {
          return json({ id: 'k', token: 'ysk_live_x' }, 201);
        }
        return json({ items: [], nextCursor: null });
      },
    });
    await client.users.list({ limit: 10 });
    await client.notifications.list();
    await client.apiKeys.list();
    await client.audit.list();
    await client.auth.login({ email: 'a@ysk.hk', password: 'password1' });
    expect(seen.some((row) => row.includes('/v1/users'))).toBe(true);
    expect(seen.some((row) => row.includes('/v1/notifications'))).toBe(true);
    expect(seen.some((row) => row.includes('/v1/me/api-keys'))).toBe(true);
    expect(seen.some((row) => row.includes('/v1/audit-logs'))).toBe(true);
    expect(seen.some((row) => row.includes('/v1/auth/login'))).toBe(true);
  });
});
