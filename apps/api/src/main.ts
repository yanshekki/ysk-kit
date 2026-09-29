import type { Server as HttpServer } from 'node:http';
import { rateLimitFromEnv } from '@ysk/config';
import { createMetricsRegistry, startOtelFromEnv } from '@ysk/observability';
import { attachSocketIoRealtime } from '@ysk/realtime';
import { createApp } from './app';
import { createFastifyApp } from './app-fastify';
import { createComposition } from './composition';
import { registerWorkers } from './workers';

const start = async () => {
  const composition = await createComposition();
  const otel = startOtelFromEnv(composition.env);
  const rateLimit = rateLimitFromEnv(composition.env);
  const input = {
    authService: composition.authService,
    userService: composition.userService,
    fileService: composition.fileService,
    notificationService: composition.notificationService,
    llmService: composition.llmService,
    deviceService: composition.deviceService,
    organizationService: composition.organizationService,
    apiKeyService: composition.apiKeyService,
    billingService: composition.billingService,
    audit: composition.audit,
    storage: composition.storage,
    logger: composition.logger,
    corsOrigins: composition.corsOrigins,
    jwtSecret: composition.env.JWT_SECRET,
    resolveApiKey: (token: string) => composition.apiKeyService.resolveToken(token),
    pingReady: composition.pingReady,
    metrics: createMetricsRegistry(),
    allowLocalUpload: composition.env.NODE_ENV !== 'production',
    ...(composition.env.STRIPE_WEBHOOK_SECRET
      ? { stripeWebhookSecret: composition.env.STRIPE_WEBHOOK_SECRET }
      : {}),
    ...(composition.queue.bullBoardQueues
      ? { bullmqQueues: composition.queue.bullBoardQueues() }
      : {}),
    ...(composition.env.NODE_ENV === 'production' ? { production: true } : {}),
    ...(rateLimit ? { rateLimit } : {}),
  };

  let server: HttpServer;
  if (composition.env.HTTP_ADAPTER === 'fastify') {
    const app = await createFastifyApp(input);
    await app.listen({ port: composition.env.API_PORT, host: '0.0.0.0' });
    server = app.server;
    composition.logger.info(`ysk-kit api (fastify) http://localhost:${composition.env.API_PORT}`);
  } else {
    const app = createApp(input);
    server = app.listen(composition.env.API_PORT, () => {
      composition.logger.info(`ysk-kit api http://localhost:${composition.env.API_PORT}`);
    });
  }

  const realtime = attachSocketIoRealtime(server, {
    jwtSecret: composition.env.JWT_SECRET,
    corsOrigins: composition.corsOrigins,
    ...(composition.env.REDIS_URL ? { redisUrl: composition.env.REDIS_URL } : {}),
  });

  if (composition.env.NODE_ENV === 'development' && composition.env.RUN_WORKERS !== '0') {
    registerWorkers({
      queue: composition.queue,
      mail: composition.mail,
      notifications: composition.notifications,
      realtime,
      devices: composition.devices,
      push: composition.push,
    });
    composition.logger.info('in-process workers started');
  }

  const shutdown = async () => {
    await otel.shutdown();
    await composition.queue.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => {
    void shutdown();
  });
};

void start();
