import { describe, expect, it } from 'vitest';
import { createMemoryQueue } from './index';

describe('memory queue', () => {
  it('validates and runs handlers on enqueue', async () => {
    const q = createMemoryQueue();
    const seen: string[] = [];
    q.process('notification.create', async (payload) => {
      seen.push(payload.userId);
    });
    await q.enqueue('notification.create', {
      userId: '11111111-1111-4111-8111-111111111111',
      type: 'auth.welcome',
      title: 'Hi',
      body: 'Welcome',
    });
    expect(seen).toEqual(['11111111-1111-4111-8111-111111111111']);
    await expect(
      q.enqueue('email.send', { to: 'nope', template: 'auth.welcome', locale: 'en', vars: {} }),
    ).rejects.toThrow();
  });
});
