import { applyCapability } from './apply-capability.js';

export const CAPABILITIES = [
  'auth',
  'rbac',
  'audit-log',
  'storage',
  'i18n',
  'jobs',
  'mail',
  'notifications',
  'llm',
  'websocket',
  'push',
  'mobile',
  'team',
  'apikey',
  'crypto',
  'billing',
] as const;
export type Capability = (typeof CAPABILITIES)[number];

const ALIASES: Record<string, Capability> = { org: 'team' };

const HINTS: Record<Capability, string[]> = {
  auth: [
    'saas flavor already includes register/login/otp/refresh/logout/me',
    'env: JWT_SECRET, JWT_ACCESS_TTL, OTP_TTL_SECONDS; TWILIO_* required in production',
    'run pnpm db:migrate after pulling Session / OtpChallenge schema',
  ],
  rbac: [
    'permissions live in @ysk-kit/contracts ROLE_PERMISSIONS',
    'requirePermission() is in @ysk-kit/api-express',
  ],
  'audit-log': [
    'GET /v1/audit-logs requires audit.read',
    'IAuditLogger.record is called from use-cases',
  ],
  storage: [
    'POST /v1/files/presign requires file.upload',
    'local adapter is default; set S3_* for an S3-compatible bucket later',
  ],
  i18n: ['@ysk-kit/i18n t(dict, key, locale) default zh-HK'],
  jobs: [
    'REDIS_URL + pnpm worker (memory queue in tests / when Redis unset)',
    'Bull Board at /admin/queues when Redis is on (ADMIN JWT, Express and Fastify)',
  ],
  mail: [
    'SMTP_URL optional; log adapter is default',
    'templates: auth.welcome, auth.reset, org.invite, auth.admin-otp',
  ],
  notifications: ['GET /v1/notifications and POST /v1/notifications/:id/read'],
  llm: [
    'POST /v1/llm/complete and POST /v1/llm/stream (SSE)',
    'merges LlmUsage; wires createLlmService + registerLlmRoutes when composition is not already hand-wired',
    'env: LLM_BASE_URL (default https://api.x.ai/v1), LLM_API_KEY or XAI_API_KEY, LLM_MODEL=grok-4.7, LLM_SYSTEM_PROMPT, LLM_QUOTA_MAX, LLM_QUOTA_WINDOW_MS',
  ],
  websocket: [
    'Socket.IO on the API HTTP server, auth.token handshake',
    'wires createRealtimeFromEnv when composition is not already hand-wired; attachSocketIoRealtime stays in main.ts',
    'event notification.created',
    'live inbox: RUN_WORKERS=1 in-process, or REDIS_URL + standalone/PM2 worker (ysk-socket.io key)',
  ],
  push: [
    'PUT/GET/DELETE /v1/me/devices; worker enqueues push.send after notification.create',
    'merges Device; wires createDeviceService + registerDeviceRoutes when composition is not already hand-wired',
    'env: EXPO_ACCESS_TOKEN optional; FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY for native tokens',
    'Expo Go uses ExponentPushToken[...]; native FCM uses HTTP v1',
  ],
  mobile: [
    'apps/mobile is the Expo template (login, home, inbox, organisations, invite, DevicePort + FilePickerPort)',
    'eas.json preview/production; app.config.ts slug ysk-kit',
    'run pnpm --filter @ysk-kit/mobile start; Expo 57 / RN 0.86',
  ],
  team: [
    'Organization + Membership + email invite; platform User.role stays global',
    'org roles: OWNER | ADMIN | MEMBER; last OWNER cannot leave',
    'invite links use WEB_PUBLIC_URL/invite?token=',
    'when apps/mobile exists, restores organisation list, detail, and accept-invite screens',
  ],
  apikey: [
    'POST/GET/DELETE /v1/me/api-keys; Bearer ysk_live_… for machine clients',
    'permissions are a subset of the owner role; API keys cannot mint more keys',
  ],
  crypto: [
    'AES-256-GCM ICryptoPort; env CRYPTO_MASTER_KEY (64 hex chars)',
    'dev uses a built-in key when NODE_ENV is not production',
  ],
  billing: [
    'requires ysk-kit add team first (Organization + Membership)',
    'GET /v1/billing/plans (public); org OWNER/ADMIN + billing.checkout for the rest',
    'log IBillingPort by default; STRIPE_SECRET_KEY + STRIPE_PRICE_PRO enable Checkout',
    'STRIPE_WEBHOOK_SECRET for POST /v1/billing/webhook (raw body)',
  ],
};

export const addCapability = (name: string, root = '.'): string[] => {
  const resolved = ALIASES[name] ?? name;
  if (!CAPABILITIES.includes(resolved as Capability)) {
    throw new Error(`unknown capability '${name}'. Try: ${CAPABILITIES.join(', ')}`);
  }
  const cap = resolved as Capability;
  return [
    ...applyCapability(root, cap),
    `ysk-kit add ${cap}: already part of the saas flavor`,
    ...HINTS[cap],
  ];
};
