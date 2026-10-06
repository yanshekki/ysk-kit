import { createMemoryQueue, type IJobQueue } from '@ysk-kit/jobs';
import { createFakeLlm } from '@ysk-kit/llm';
import { createLogMailer } from '@ysk-kit/mail';
import { createLogPush } from '@ysk-kit/push';
import { createMemoryRealtime } from '@ysk-kit/realtime';
import { createLocalStorage } from '@ysk-kit/storage';
import pino from 'pino';
import type { CreateAppInput } from './app';
import { createApiKeyService } from './modules/api-keys/application/api-key-service';
import { createMemoryApiKeyRepository } from './modules/api-keys/infra/memory-api-key-repository';
import { createBillingService } from './modules/billing/application/billing-service';
import { createLogBilling } from './modules/billing/infra/log-billing';
import { createMemorySubscriptionRepository } from './modules/billing/infra/memory-subscription-repository';
import { createMemoryWebhookEventRepository } from './modules/billing/infra/memory-webhook-event-repository';
import { createDeviceService } from './modules/devices/application/device-service';
import { createMemoryDeviceRepository } from './modules/devices/infra/memory-device-repository';
import { createFileService } from './modules/files/application/file-service';
import { createMemoryFileRepository } from './modules/files/infra/memory-file-repository';
import { createAuthService } from './modules/identity/application/auth-service';
import { createUserService } from './modules/identity/application/user-service';
import { createMemoryPasswordResetRepository } from './modules/identity/infra/memory-password-reset';
import {
  createMemoryAuditLogger,
  createMemoryOtpRepository,
  createMemorySessionRepository,
  createMemoryUserRepository,
  createSilentOtpSender,
} from './modules/identity/infra/memory-stores';
import { createLlmService } from './modules/llm/application/llm-service';
import { createMemoryLlmUsageRepository } from './modules/llm/infra/memory-usage-repository';
import { createNotificationService } from './modules/notifications/application/notification-service';
import { createMemoryNotificationRepository } from './modules/notifications/infra/memory-notification-repository';
import { createOrganizationService } from './modules/organizations/application/organization-service';
import { createMemoryOrganizationRepository } from './modules/organizations/infra/memory-organization-repository';
import { registerWorkers } from './workers';

export const TEST_JWT_SECRET = 'test-secret-key-must-be-long';

export const createMemoryInput = () => {
  const otpSink: { last?: { phone: string; code: string } } = {};
  const jobs: Array<{ name: string; payload: { vars?: Record<string, string> } }> = [];
  const users = createMemoryUserRepository();
  const sessions = createMemorySessionRepository();
  const otps = createMemoryOtpRepository();
  const resets = createMemoryPasswordResetRepository();
  const audit = createMemoryAuditLogger();
  const notifications = createMemoryNotificationRepository();
  const devices = createMemoryDeviceRepository();
  const orgs = createMemoryOrganizationRepository();
  const keys = createMemoryApiKeyRepository();
  const push = createLogPush();
  const storage = createLocalStorage({ publicBaseUrl: 'http://localhost:3001' });
  const innerQueue = createMemoryQueue();
  const queue: IJobQueue = {
    enqueue: async (name, payload, opts) => {
      jobs.push({ name, payload: payload as { vars?: Record<string, string> } });
      return innerQueue.enqueue(name, payload, opts);
    },
    process: innerQueue.process.bind(innerQueue),
    close: innerQueue.close.bind(innerQueue),
  };
  const mail = createLogMailer();
  const realtime = createMemoryRealtime();
  const usage = createMemoryLlmUsageRepository();
  registerWorkers({
    queue: innerQueue,
    mail,
    notifications,
    realtime,
    devices,
    push,
  });
  const apiKeyService = createApiKeyService({ keys, users, audit });
  const input: CreateAppInput = {
    authService: createAuthService({
      users,
      sessions,
      otps,
      resets,
      jobs: queue,
      audit,
      otpSender: createSilentOtpSender(otpSink),
      webPublicUrl: 'http://localhost:5173',
      jwtSecret: TEST_JWT_SECRET,
      accessTtl: '15m',
      otpTtlSeconds: 300,
    }),
    userService: createUserService(users, audit, queue, sessions),
    organizationService: createOrganizationService({
      orgs,
      users,
      jobs: queue,
      audit,
      webPublicUrl: 'http://localhost:5173',
    }),
    apiKeyService,
    billingService: createBillingService({
      subscriptions: createMemorySubscriptionRepository(),
      billing: createLogBilling(),
      orgs,
      webhookEvents: createMemoryWebhookEventRepository(),
    }),
    fileService: createFileService(createMemoryFileRepository(), storage, audit),
    notificationService: createNotificationService(notifications),
    llmService: createLlmService({
      llm: createFakeLlm({ text: 'pong' }),
      usage,
      configured: true,
      production: false,
    }),
    deviceService: createDeviceService(devices),
    audit,
    storage,
    logger: pino({ level: 'silent' }),
    corsOrigins: ['http://localhost:5173'],
    jwtSecret: TEST_JWT_SECRET,
    resolveApiKey: (token: string) => apiKeyService.resolveToken(token),
    pingReady: async () => true,
    allowLocalUpload: true,
  };
  return { input, otpSink, mail, jobs, realtime, usage, push, users, sessions, orgs };
};
