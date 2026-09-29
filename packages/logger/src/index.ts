import pino, { type DestinationStream, type Logger, type LoggerOptions } from 'pino';

export type { Logger };

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
