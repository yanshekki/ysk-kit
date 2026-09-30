import { createMemoryQueue } from '@ysk-kit/jobs';
import { createLogMailer } from '@ysk-kit/mail';
import { createMemoryRealtime } from '@ysk-kit/realtime';
import { describe, expect, it } from 'vitest';
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
});
