import { startOtelFromEnv } from '@ysk-kit/observability';
import { createComposition } from './composition';
import { registerWorkers } from './workers';

const start = async () => {
  const composition = await createComposition();
  const otel = startOtelFromEnv(composition.env, {
    instrumentHttp: false,
    defaultServiceName: 'ysk-worker',
  });
  registerWorkers({
    queue: composition.queue,
    mail: composition.mail,
    notifications: composition.notifications,
    realtime: composition.realtime,
    devices: composition.devices,
    push: composition.push,
  });
  if (!composition.env.REDIS_URL) {
    composition.logger.warn('standalone worker: live inbox needs REDIS_URL or in-process workers');
  }
  composition.logger.info('ysk-kit worker running');
  const shutdown = async () => {
    await otel.shutdown();
    await composition.queue.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => {
    void shutdown();
  });
  process.on('SIGINT', () => {
    void shutdown();
  });
};

void start();
