import { createMemoryRealtime } from './memory.js';
import type { IRealtimePort } from './port.js';
import { createRedisRealtimeEmitter } from './redis-emitter.js';

export const createRealtimeFromEnv = (env: { REDIS_URL?: string | undefined }): IRealtimePort => {
  if (env.REDIS_URL) return createRedisRealtimeEmitter(env.REDIS_URL);
  return createMemoryRealtime();
};
