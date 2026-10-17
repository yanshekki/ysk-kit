import { createMemoryQueue } from '@ysk-kit/jobs';
import { createLogMailer } from '@ysk-kit/mail';
import { createMemoryRealtime } from '@ysk-kit/realtime';
import { describe, expect, it, vi } from 'vitest';
import { createMemoryNotificationRepository } from './modules/notifications/infra/memory-notification-repository';
import { registerWorkers } from './workers';

describe('registerWorkers', () => {
  it('creates in-app notifications without a device port', async () => {
    const queue = createMemoryQueue();
    const notifications = createMemoryNotificationRepository();
    const realtime = createMemoryRealtime();
    registerWorkers({
      queue,
      mail: createLogMailer(),
      notifications,
      realtime,
    });
    await queue.enqueue('notification.create', {
      userId: '11111111-1111-4111-8111-111111111111',
      type: 'auth.welcome',
      title: 'Hi',
      body: 'Welcome',
    });
    const rows = await notifications.listForUser('11111111-1111-4111-8111-111111111111', {
      limit: 10,
    });
    expect(rows.items).toHaveLength(1);
    expect(realtime.events.some((event) => event.event === 'notification.created')).toBe(true);
  });

  it('logs job failures then rethrows', async () => {
    const queue = createMemoryQueue();
    const logger = { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() };
    registerWorkers({
      queue,
      mail: {
        send: async () => {
          throw new Error('smtp down');
        },
      },
      notifications: createMemoryNotificationRepository(),
      realtime: createMemoryRealtime(),
      logger: logger as never,
    });
    await expect(
      queue.enqueue('email.send', {
        to: 'user@ysk.hk',
        template: 'auth.welcome',
        locale: 'en',
        vars: { name: 'Ki' },
      }),
    ).rejects.toThrow('smtp down');
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error.mock.calls[0]?.[0]).toMatchObject({ job: 'email.send' });
  });
});
