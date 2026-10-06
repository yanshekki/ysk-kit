import pino, { type DestinationStream, type Logger, type LoggerOptions } from 'pino';

export type { Logger };

export const LOG_REDACT_PATHS = [
  'authorization',
  'cookie',
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'api_key',
  'secret',
  'webhookSecret',
  'otp',
  'JWT_SECRET',
  'LLM_API_KEY',
  'XAI_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'CRYPTO_MASTER_KEY',
  'TWILIO_AUTH_TOKEN',
  'FCM_PRIVATE_KEY',
  'S3_SECRET_KEY',
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["set-cookie"]',
  'res.headers["set-cookie"]',
  '*.authorization',
  '*.cookie',
  '*.password',
  '*.passwordHash',
  '*.token',
  '*.accessToken',
  '*.refreshToken',
  '*.apiKey',
  '*.api_key',
  '*.secret',
  '*.webhookSecret',
  '*.otp',
] as const;

export function createLogger(opts: {
  name?: string;
  env: string;
  mixin?: LoggerOptions['mixin'];
  destination?: DestinationStream;
}): Logger {
  const production = opts.env === 'production';
  const options: LoggerOptions = {
    name: opts.name ?? 'ysk',
    level: production ? 'info' : 'debug',
    redact: {
      paths: [...LOG_REDACT_PATHS],
      censor: '[Redacted]',
    },
  };
  if (opts.mixin) options.mixin = opts.mixin;
  if (!production) {
    options.transport = {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:standard' },
    };
  }
  return opts.destination ? pino(options, opts.destination) : pino(options);
}
