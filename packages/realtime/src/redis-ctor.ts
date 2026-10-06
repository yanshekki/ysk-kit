import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/** NodeNext types ioredis as a CJS namespace; the constructor is the runtime default. */
export type RedisClient = {
  publish(channel: string, message: string | Buffer): unknown;
  duplicate(): RedisClient;
  quit: () => Promise<unknown>;
};

export const Redis = require('ioredis') as new (
  url: string,
  options?: { maxRetriesPerRequest: null },
) => RedisClient;
