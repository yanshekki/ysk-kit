import type { Capability } from './add-capability';
import {
  patchBillingApp,
  patchBillingComposition,
  patchBillingContracts,
  patchBillingFastify,
  patchBillingMain,
  patchBillingMemory,
  patchBillingSdk,
  patchBillingWeb,
  patchBillingWebSdk,
  patchLlmApp,
  patchLlmComposition,
  patchLlmContracts,
  patchLlmFastify,
  patchLlmMain,
  patchLlmMemory,
  patchLlmSdk,
  patchLlmWeb,
  patchLlmWebSdk,
  patchPushApp,
  patchPushComposition,
  patchPushContracts,
  patchPushFastify,
  patchPushMain,
  patchPushMemory,
  patchPushSdk,
  patchPushWorker,
  patchTeamApp,
  patchTeamComposition,
  patchTeamContracts,
  patchTeamFastify,
  patchTeamMain,
  patchTeamMemory,
  patchTeamSdk,
  patchTeamWeb,
  patchTeamWebSdk,
} from './capability-patches';
import { ensureMarkerBlock, insertAfterLastImport } from './patch-text';

export type CapabilityRecipe = {
  prisma?: string;
  userFields?: string[];
  organizationFields?: string[];
  env?: string[];
  apiDeps?: string[];
  skipSourceIf?: string;
  copySource?: boolean;
  patchApp?: (src: string) => string;
  patchComposition?: (src: string) => string;
  patchFastify?: (src: string) => string;
  patchMain?: (src: string) => string;
  patchMemoryInput?: (src: string) => string;
  patchSdk?: (src: string) => string;
  patchWebSdk?: (src: string) => string;
  patchWebRouter?: (src: string) => string;
  patchContracts?: (src: string) => string;
  patchWorker?: (src: string) => string;
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
    copySource: true,
    patchApp: patchLlmApp,
    patchComposition: patchLlmComposition,
    patchFastify: patchLlmFastify,
    patchMain: patchLlmMain,
    patchMemoryInput: patchLlmMemory,
    patchSdk: patchLlmSdk,
    patchWebSdk: patchLlmWebSdk,
    patchWebRouter: patchLlmWeb,
    patchContracts: patchLlmContracts,
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
    copySource: true,
    patchApp: patchPushApp,
    patchComposition: patchPushComposition,
    patchFastify: patchPushFastify,
    patchMain: patchPushMain,
    patchMemoryInput: patchPushMemory,
    patchSdk: patchPushSdk,
    patchContracts: patchPushContracts,
    patchWorker: patchPushWorker,
  },
  mobile: {},
  team: {
    prisma: 'modules/team/prisma/organization.prisma',
    userFields: ['memberships Membership[]'],
    skipSourceIf: 'createOrganizationService',
    copySource: true,
    patchApp: patchTeamApp,
    patchComposition: patchTeamComposition,
    patchFastify: patchTeamFastify,
    patchMain: patchTeamMain,
    patchMemoryInput: patchTeamMemory,
    patchSdk: patchTeamSdk,
    patchWebSdk: patchTeamWebSdk,
    patchWebRouter: patchTeamWeb,
    patchContracts: patchTeamContracts,
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
    copySource: true,
    patchApp: patchBillingApp,
    patchComposition: patchBillingComposition,
    patchFastify: patchBillingFastify,
    patchMain: patchBillingMain,
    patchMemoryInput: patchBillingMemory,
    patchSdk: patchBillingSdk,
    patchWebSdk: patchBillingWebSdk,
    patchWebRouter: patchBillingWeb,
    patchContracts: patchBillingContracts,
  },
};
