import { createMemoryRealtime } from './memory';
import type { IRealtimePort } from './port';
import { createRedisRealtimeEmitter } from './redis-emitter';

export const createRealtimeFromEnv = (env: { REDIS_URL?: string | undefined }): IRealtimePort => {
  if (env.REDIS_URL) return createRedisRealtimeEmitter(env.REDIS_URL);
  return createMemoryRealtime();
};
