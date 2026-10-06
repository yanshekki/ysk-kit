import { Emitter } from '@socket.io/redis-emitter';
import { type IRealtimePort, SOCKET_IO_REDIS_KEY } from './port.js';
import { Redis } from './redis-ctor.js';

export type RedisPublishClient = {
  publish(channel: string, message: string | Buffer): unknown;
  quit?: () => Promise<unknown>;
};

export const createRedisRealtimeEmitter = (input: string | RedisPublishClient): IRealtimePort => {
  const owned = typeof input === 'string';
  const redis: RedisPublishClient = owned
    ? new Redis(input, { maxRetriesPerRequest: null })
    : input;
  const emitter = new Emitter(redis, { key: SOCKET_IO_REDIS_KEY });
  return {
    async emitToUser(userId, event, payload) {
      emitter.to(`user:${userId}`).emit(event, payload);
    },
    async close() {
      if (owned && redis.quit) await redis.quit();
    },
  };
};
