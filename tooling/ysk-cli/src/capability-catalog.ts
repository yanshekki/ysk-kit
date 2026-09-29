import type { Capability } from './add-capability';
import { ensureMarkerBlock, insertAfterLastImport } from './patch-text';

export type CapabilityRecipe = {
  prisma?: string;
  userFields?: string[];
  organizationFields?: string[];
  env?: string[];
  apiDeps?: string[];
  skipSourceIf?: string;
  patchApp?: (src: string) => string;
  patchComposition?: (src: string) => string;
};

const patchTeamApp = (src: string): string => {
  const next = insertAfterLastImport(
    src,
    "import { registerOrganizationRoutes } from './modules/organizations/infra/organization-router';",
  );
  return ensureMarkerBlock(
    next,
    'team',
    '  registerOrganizationRoutes(app, input.organizationService);',
    '  return app;',
  );
};

const patchTeamComposition = (src: string): string => {
  let next = insertAfterLastImport(
    src,
    "import { createOrganizationService } from './modules/organizations/application/organization-service';",
  );
  next = insertAfterLastImport(
    next,
    "import { createPrismaOrganizationRepository } from './modules/organizations/infra/prisma-organization-repository';",
  );
  return ensureMarkerBlock(
    next,
    'team',
    '  const organizationService = createOrganizationService({ orgs: createPrismaOrganizationRepository(prisma), users, jobs: queue, audit, webPublicUrl: env.WEB_PUBLIC_URL });',
    '  return {',
  );
};

const patchLlmApp = (src: string): string => {
  const next = insertAfterLastImport(
    src,
    "import { registerLlmRoutes } from './modules/llm/infra/llm-router';",
  );
  return ensureMarkerBlock(
    next,
    'llm',
    '  registerLlmRoutes(app, input.llmService);',
    '  return app;',
  );
};

const patchLlmComposition = (src: string): string => {
  let next = insertAfterLastImport(src, "import { createLlmFromEnv } from '@ysk/llm';");
  next = insertAfterLastImport(
    next,
    "import { createLlmService } from './modules/llm/application/llm-service';",
  );
  next = insertAfterLastImport(
    next,
    "import { createPrismaLlmUsageRepository } from './modules/llm/infra/prisma-usage-repository';",
  );
  return ensureMarkerBlock(
    next,
    'llm',
    `  const llm = opts?.llm ?? createLlmFromEnv(env);
  const llmService = createLlmService({
    llm,
    usage: createPrismaLlmUsageRepository(prisma),
    configured: Boolean(env.LLM_API_KEY || env.XAI_API_KEY),
    production: env.NODE_ENV === 'production',
  });`,
    '  return {',
  );
};

const patchPushApp = (src: string): string => {
  const next = insertAfterLastImport(
    src,
    "import { registerDeviceRoutes } from './modules/devices/infra/device-router';",
  );
  return ensureMarkerBlock(
    next,
    'push',
    '  registerDeviceRoutes(app, input.deviceService);',
    '  return app;',
  );
};

const patchPushComposition = (src: string): string => {
  let next = insertAfterLastImport(src, "import { createPushFromEnv } from '@ysk/push';");
  next = insertAfterLastImport(
    next,
    "import { createDeviceService } from './modules/devices/application/device-service';",
  );
  next = insertAfterLastImport(
    next,
    "import { createPrismaDeviceRepository } from './modules/devices/infra/prisma-device-repository';",
  );
  return ensureMarkerBlock(
    next,
    'push',
    `  const devices = createPrismaDeviceRepository(prisma);
  const push = createPushFromEnv(env);
  const deviceService = createDeviceService(devices);`,
    '  return {',
  );
};

const patchWebsocketComposition = (src: string): string => {
  const next = insertAfterLastImport(src, "import { createRealtimeFromEnv } from '@ysk/realtime';");
  return ensureMarkerBlock(
    next,
    'websocket',
    '  const realtime = opts?.realtime ?? createRealtimeFromEnv(env);',
    '  return {',
  );
};

export const CATALOG: Record<Capability, CapabilityRecipe> = {
  auth: {
    prisma: 'modules/auth/prisma/session.prisma',
    env: [
      'JWT_SECRET',
      'JWT_ACCESS_TTL',
      'OTP_TTL_SECONDS',
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'TWILIO_FROM',
    ],
    apiDeps: ['@ysk/auth'],
  },
  rbac: {},
  'audit-log': {
    prisma: 'modules/audit-log/prisma/audit-log.prisma',
  },
  storage: {
    prisma: 'modules/files/prisma/file-object.prisma',
    userFields: ['files FileObject[]'],
    env: ['S3_ENDPOINT', 'S3_BUCKET', 'S3_ACCESS_KEY', 'S3_SECRET_KEY', 'S3_REGION'],
    apiDeps: ['@ysk/storage'],
  },
  i18n: {},
  jobs: {
    env: ['REDIS_URL'],
    apiDeps: ['@ysk/jobs'],
  },
  mail: {
    env: ['SMTP_URL', 'MAIL_FROM'],
    apiDeps: ['@ysk/mail'],
  },
  notifications: {},
  llm: {
    prisma: 'modules/llm/prisma/llm-usage.prisma',
    userFields: ['llmUsages LlmUsage[]'],
    env: ['LLM_BASE_URL', 'LLM_API_KEY', 'XAI_API_KEY', 'LLM_MODEL'],
    apiDeps: ['@ysk/llm'],
    skipSourceIf: 'createLlmService',
    patchApp: patchLlmApp,
    patchComposition: patchLlmComposition,
  },
  websocket: {
    env: ['RUN_WORKERS'],
    apiDeps: ['@ysk/realtime'],
    skipSourceIf: 'createRealtimeFromEnv',
    patchComposition: patchWebsocketComposition,
  },
  push: {
    prisma: 'modules/push/prisma/device.prisma',
    userFields: ['devices Device[]'],
    env: ['EXPO_ACCESS_TOKEN', 'FCM_PROJECT_ID', 'FCM_CLIENT_EMAIL', 'FCM_PRIVATE_KEY'],
    apiDeps: ['@ysk/push'],
    skipSourceIf: 'createDeviceService',
    patchApp: patchPushApp,
    patchComposition: patchPushComposition,
  },
  mobile: {},
  team: {
    prisma: 'modules/team/prisma/organization.prisma',
    userFields: ['memberships Membership[]'],
    skipSourceIf: 'createOrganizationService',
    patchApp: patchTeamApp,
    patchComposition: patchTeamComposition,
  },
  apikey: {
    prisma: 'modules/apikey/prisma/api-key.prisma',
    userFields: ['apiKeys ApiKey[]'],
    skipSourceIf: 'createApiKeyService',
  },
  crypto: {
    env: ['CRYPTO_MASTER_KEY'],
    apiDeps: ['@ysk/crypto'],
  },
  billing: {
    prisma: 'modules/billing/prisma/subscription.prisma',
    organizationFields: ['stripeCustomerId String?', 'subscription Subscription?'],
    skipSourceIf: 'createBillingService',
  },
};
