import { type JobName, type JobPayload, RealtimeEvent } from '@ysk/contracts';
import type { IJobQueue } from '@ysk/jobs';
import type { IMailPort } from '@ysk/mail';
import { withJobSpan } from '@ysk/observability';
import type { IPushPort } from '@ysk/push';
import type { IRealtimePort } from '@ysk/realtime';
import { hashDeviceToken } from './modules/devices/application/device-service';
import type { IDeviceRepository } from './modules/devices/domain/device-repository';
import type { INotificationRepository } from './modules/notifications/domain/notification-repository';

const processJob = <K extends JobName>(
  queue: IJobQueue,
  name: K,
  handler: (payload: JobPayload[K]) => Promise<void>,
): void => {
  queue.process(name, (payload) => withJobSpan(name, () => handler(payload)));
};

export const registerWorkers = (opts: {
  queue: IJobQueue;
  mail: IMailPort;
  notifications: INotificationRepository;
  realtime: IRealtimePort;
  devices: IDeviceRepository;
  push: IPushPort;
}): void => {
  processJob(opts.queue, 'email.send', async (payload) => {
    await opts.mail.send(payload);
  });
  processJob(opts.queue, 'notification.create', async (payload) => {
    const row = await opts.notifications.create(payload);
    await opts.realtime.emitToUser(row.userId, RealtimeEvent.NOTIFICATION_CREATED, {
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      readAt: row.readAt ? row.readAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
    });
    const devices = await opts.devices.listForUser(row.userId);
    for (const device of devices) {
      await opts.queue.enqueue('push.send', {
        token: device.token,
        title: row.title,
        body: row.body,
        data: { notificationId: row.id },
      });
    }
  });
  processJob(opts.queue, 'push.send', async (payload) => {
    const result = await opts.push.send(payload);
    if (result === 'invalid-token') {
      await opts.devices.deleteByTokenHash(hashDeviceToken(payload.token));
    }
  });
};
