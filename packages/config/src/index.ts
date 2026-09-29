import { z } from 'zod';

type EnvMap = Record<string, string | undefined>;

const envMap = (): EnvMap => {
  const proc = (globalThis as { process?: { env?: EnvMap } }).process;
  return proc?.env ?? {};
};

const readEnv = (key: string): string | undefined => envMap()[key];

export const PublicConfigSchema = z.object({
  apiPublicUrl: z.string().url(),
  webPublicUrl: z.string().url(),
  adminPublicUrl: z.string().url(),
});

export type PublicConfig = z.infer<typeof PublicConfigSchema>;

export const defaultPublicConfig = (): PublicConfig =>
  PublicConfigSchema.parse({
    apiPublicUrl: readEnv('API_PUBLIC_URL') ?? 'http://localhost:3001',
    webPublicUrl: readEnv('WEB_PUBLIC_URL') ?? 'http://localhost:5173',
    adminPublicUrl: readEnv('ADMIN_PUBLIC_URL') ?? 'http://localhost:5174',
  });

export const ServerEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  JWT_ACCESS_TTL: z.string().default('15m'),
  OTP_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  API_PUBLIC_URL: z.string().url().default('http://localhost:3001'),
  WEB_PUBLIC_URL: z.string().url().default('http://localhost:5173'),
  ADMIN_PUBLIC_URL: z.string().url().default('http://localhost:5174'),
  REDIS_URL: z.string().optional(),
  SMTP_URL: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_REGION: z.string().optional(),
  RUN_WORKERS: z.string().optional(),
  LLM_BASE_URL: z.string().optional(),
  LLM_API_KEY: z.string().optional(),
  XAI_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().optional(),
  EXPO_ACCESS_TOKEN: z.string().optional(),
  FCM_PROJECT_ID: z.string().optional(),
  FCM_CLIENT_EMAIL: z.string().optional(),
  FCM_PRIVATE_KEY: z.string().optional(),
  HTTP_ADAPTER: z.enum(['express', 'fastify']).optional(),
  CRYPTO_MASTER_KEY: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM: z.string().optional(),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
  OTEL_EXPORTER_OTLP_METRICS_ENDPOINT: z.string().optional(),
  OTEL_SERVICE_NAME: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_PRO: z.string().optional(),
  RATE_LIMIT_MAX: z.coerce.number().int().nonnegative().default(300),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

export const loadServerEnv = (source: EnvMap = envMap()): ServerEnv =>
  ServerEnvSchema.parse({
    NODE_ENV: source.NODE_ENV,
    API_PORT: source.API_PORT,
    DATABASE_URL: source.DATABASE_URL,
    JWT_SECRET: source.JWT_SECRET,
    JWT_ACCESS_TTL: source.JWT_ACCESS_TTL,
    OTP_TTL_SECONDS: source.OTP_TTL_SECONDS,
    API_PUBLIC_URL: source.API_PUBLIC_URL,
    WEB_PUBLIC_URL: source.WEB_PUBLIC_URL,
    ADMIN_PUBLIC_URL: source.ADMIN_PUBLIC_URL,
    REDIS_URL: source.REDIS_URL,
    SMTP_URL: source.SMTP_URL,
    MAIL_FROM: source.MAIL_FROM,
    S3_ENDPOINT: source.S3_ENDPOINT,
    S3_BUCKET: source.S3_BUCKET,
    S3_ACCESS_KEY: source.S3_ACCESS_KEY,
    S3_SECRET_KEY: source.S3_SECRET_KEY,
    S3_REGION: source.S3_REGION,
    RUN_WORKERS: source.RUN_WORKERS,
    LLM_BASE_URL: source.LLM_BASE_URL,
    LLM_API_KEY: source.LLM_API_KEY,
    XAI_API_KEY: source.XAI_API_KEY,
    LLM_MODEL: source.LLM_MODEL,
    EXPO_ACCESS_TOKEN: source.EXPO_ACCESS_TOKEN,
    FCM_PROJECT_ID: source.FCM_PROJECT_ID,
    FCM_CLIENT_EMAIL: source.FCM_CLIENT_EMAIL,
    FCM_PRIVATE_KEY: source.FCM_PRIVATE_KEY,
    HTTP_ADAPTER: source.HTTP_ADAPTER,
    CRYPTO_MASTER_KEY: source.CRYPTO_MASTER_KEY,
    TWILIO_ACCOUNT_SID: source.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: source.TWILIO_AUTH_TOKEN,
    TWILIO_FROM: source.TWILIO_FROM,
    OTEL_EXPORTER_OTLP_ENDPOINT: source.OTEL_EXPORTER_OTLP_ENDPOINT,
    OTEL_EXPORTER_OTLP_METRICS_ENDPOINT: source.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT,
    OTEL_SERVICE_NAME: source.OTEL_SERVICE_NAME,
    STRIPE_SECRET_KEY: source.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: source.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_PRO: source.STRIPE_PRICE_PRO,
    RATE_LIMIT_MAX: source.RATE_LIMIT_MAX,
    RATE_LIMIT_WINDOW_MS: source.RATE_LIMIT_WINDOW_MS,
  });

export const rateLimitFromEnv = (
  env: Pick<ServerEnv, 'RATE_LIMIT_MAX' | 'RATE_LIMIT_WINDOW_MS'>,
): { max: number; windowMs: number } | undefined => {
  if (env.RATE_LIMIT_MAX === 0) return undefined;
  return { max: env.RATE_LIMIT_MAX, windowMs: env.RATE_LIMIT_WINDOW_MS };
};

export const corsOrigins = (
  env: Pick<ServerEnv, 'WEB_PUBLIC_URL' | 'ADMIN_PUBLIC_URL'>,
): string[] => [env.WEB_PUBLIC_URL, env.ADMIN_PUBLIC_URL];
