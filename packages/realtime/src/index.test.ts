import { describe, expect, it } from 'vitest';
import { createRealtimeFromEnv } from './from-env';
import { createMemoryRealtime } from './memory';
import { SOCKET_IO_REDIS_KEY } from './port';
import { createRedisRealtimeEmitter } from './redis-emitter';

describe('memory realtime', () => {
  it('records emitToUser', async () => {
    const rt = createMemoryRealtime();
    await rt.emitToUser('u1', 'notification.created', { id: 'n1' });
    expect(rt.events).toEqual([
      { userId: 'u1', event: 'notification.created', payload: { id: 'n1' } },
    ]);
  });
});

describe('redis emitter', () => {
  it('publishes to the ysk-socket.io channel for a user room', async () => {
    const published: Array<{ channel: string; message: string | Buffer }> = [];
    const rt = createRedisRealtimeEmitter({
      publish: (channel, message) => {
        published.push({ channel, message });
      },
    });
    await rt.emitToUser('u1', 'notification.created', { id: 'n1' });
    expect(published.length).toBeGreaterThan(0);
    expect(published.some((row) => String(row.channel).includes(SOCKET_IO_REDIS_KEY))).toBe(true);
    const blob = published.map((row) => String(row.message)).join(' ');
    expect(blob).toContain('u1');
    expect(blob).toContain('notification.created');
  });
});

describe('createRealtimeFromEnv', () => {
  it('uses memory when REDIS_URL is unset', () => {
    const rt = createRealtimeFromEnv({});
    expect('events' in rt).toBe(true);
  });
});
