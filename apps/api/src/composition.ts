import { corsOrigins, loadServerEnv, type ServerEnv } from '@ysk/config';
import { createBullmqQueue, createMemoryQueue, type IJobQueue } from '@ysk/jobs';
import { createLlmFromEnv, type ILlmPort } from '@ysk/llm';
import { createLogger, type Logger } from '@ysk/logger';
import { createMailerFromEnv, type IMailPort } from '@ysk/mail';
import { pinoOtelMixin } from '@ysk/observability';
import { createPushFromEnv, type IPushPort } from '@ysk/push';
import { createRealtimeFromEnv, type IRealtimePort } from '@ysk/realtime';
import { createStorageFromEnv, type IStoragePort } from '@ysk/storage';
import { createPrisma, type PrismaClient } from './infra/create-prisma';
import {
  type ApiKeyService,
  createApiKeyService,
} from './modules/api-keys/application/api-key-service';
import { createPrismaApiKeyRepository } from './modules/api-keys/infra/prisma-api-key-repository';
import type { IAuditLogger } from './modules/audit-log/domain/audit-logger';
import { createPrismaAuditLogger } from './modules/audit-log/infra/prisma-audit-logger';
import {
  type BillingService,
  createBillingService,
} from './modules/billing/application/billing-service';
import { createLogBilling } from './modules/billing/infra/log-billing';
import { createPrismaSubscriptionRepository } from './modules/billing/infra/prisma-subscription-repository';
import { createBillingFromEnv } from './modules/billing/infra/stripe-billing';
import {
  createDeviceService,
  type DeviceService,
} from './modules/devices/application/device-service';
import type { IDeviceRepository } from './modules/devices/domain/device-repository';
import { createPrismaDeviceRepository } from './modules/devices/infra/prisma-device-repository';
import { createFileService, type FileService } from './modules/files/application/file-service';
import { createPrismaFileRepository } from './modules/files/infra/prisma-file-repository';
import { type AuthService, createAuthService } from './modules/identity/application/auth-service';
import { createUserService, type UserService } from './modules/identity/application/user-service';
import { createPrismaOtpRepository } from './modules/identity/infra/prisma-otp-repository';
import { createPrismaPasswordResetRepository } from './modules/identity/infra/prisma-password-reset';
import { createPrismaSessionRepository } from './modules/identity/infra/prisma-session-repository';
import { createPrismaUserRepository } from './modules/identity/infra/prisma-user-repository';
import { createOtpSenderFromEnv } from './modules/identity/infra/twilio-otp-sender';
import { createLlmService, type LlmService } from './modules/llm/application/llm-service';
import { createPrismaLlmUsageRepository } from './modules/llm/infra/prisma-usage-repository';
import {
  createNotificationService,
  type NotificationService,
} from './modules/notifications/application/notification-service';
import type { INotificationRepository } from './modules/notifications/domain/notification-repository';
import { createPrismaNotificationRepository } from './modules/notifications/infra/prisma-notification-repository';
import {
  createOrganizationService,
  type OrganizationService,
} from './modules/organizations/application/organization-service';
import { createPrismaOrganizationRepository } from './modules/organizations/infra/prisma-organization-repository';

export type Composition = {
  env: ServerEnv;
  logger: Logger;
  prisma: PrismaClient;
  audit: IAuditLogger;
  authService: AuthService;
  userService: UserService;
  fileService: FileService;
  notificationService: NotificationService;
  notifications: INotificationRepository;
  storage: IStoragePort;
  queue: IJobQueue;
  mail: IMailPort;
  llm: ILlmPort;
  llmService: LlmService;
  realtime: IRealtimePort;
  devices: IDeviceRepository;
  deviceService: DeviceService;
  organizationService: OrganizationService;
  apiKeyService: ApiKeyService;
  billingService: BillingService;
  push: IPushPort;
  corsOrigins: string[];
  pingReady: () => Promise<boolean>;
};

export const createComposition = async (opts?: {
  source?: NodeJS.ProcessEnv;
  queue?: IJobQueue;
  mail?: IMailPort;
  llm?: ILlmPort;
  realtime?: IRealtimePort;
}): Promise<Composition> => {
  const env = loadServerEnv(opts?.source);
  const logger = createLogger({ name: 'api', env: env.NODE_ENV, mixin: pinoOtelMixin });
  const prisma = createPrisma(env.DATABASE_URL);
  const users = createPrismaUserRepository(prisma);
  const sessions = createPrismaSessionRepository(prisma);
  const otps = createPrismaOtpRepository(prisma);
  const resets = createPrismaPasswordResetRepository(prisma);
  const audit = createPrismaAuditLogger(prisma);
  const notifications = createPrismaNotificationRepository(prisma);
  const devices = createPrismaDeviceRepository(prisma);
  const orgs = createPrismaOrganizationRepository(prisma);
  const push = createPushFromEnv(env);
  const storage = createStorageFromEnv(env);
  const queue =
    opts?.queue ??
    (env.REDIS_URL ? await createBullmqQueue({ redisUrl: env.REDIS_URL }) : createMemoryQueue());
  const mail = opts?.mail ?? createMailerFromEnv(env);
  const llm = opts?.llm ?? createLlmFromEnv(env);
  const realtime = opts?.realtime ?? createRealtimeFromEnv(env);
  const llmService = createLlmService({
    llm,
    usage: createPrismaLlmUsageRepository(prisma),
    configured: Boolean(env.LLM_API_KEY || env.XAI_API_KEY),
    production: env.NODE_ENV === 'production',
  });
  const authService = createAuthService({
    users,
    sessions,
    otps,
    resets,
    jobs: queue,
    audit,
    otpSender: createOtpSenderFromEnv(env, logger),
    webPublicUrl: env.WEB_PUBLIC_URL,
    jwtSecret: env.JWT_SECRET,
    accessTtl: env.JWT_ACCESS_TTL,
    otpTtlSeconds: env.OTP_TTL_SECONDS,
  });
  return {
    env,
    logger,
    prisma,
    audit,
    authService,
    userService: createUserService(users, audit, queue, sessions),
    organizationService: createOrganizationService({
      orgs,
      users,
      jobs: queue,
      audit,
      webPublicUrl: env.WEB_PUBLIC_URL,
    }),
    apiKeyService: createApiKeyService({
      keys: createPrismaApiKeyRepository(prisma),
      users,
      audit,
    }),
    billingService: createBillingService({
      subscriptions: createPrismaSubscriptionRepository(prisma),
      billing: createBillingFromEnv(env, createLogBilling()),
      orgs,
    }),
    fileService: createFileService(createPrismaFileRepository(prisma), storage, audit),
    notificationService: createNotificationService(notifications),
    notifications,
    storage,
    queue,
    mail,
    llm,
    llmService,
    realtime,
    devices,
    deviceService: createDeviceService(devices),
    push,
    corsOrigins: corsOrigins(env),
    pingReady: async () => {
      await prisma.$queryRaw`SELECT 1`;
      if (env.REDIS_URL) {
        const { default: IORedis } = await import('ioredis');
        const redis = new IORedis(env.REDIS_URL);
        await redis.ping();
        await redis.quit();
      }
      return true;
    },
  };
};
