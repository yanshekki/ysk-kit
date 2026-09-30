import type { Server as HttpServer } from 'node:http';
import { createAdapter } from '@socket.io/redis-adapter';
import { verifyAccessToken } from '@ysk-kit/auth';
import Redis from 'ioredis';
import { Server } from 'socket.io';
import { type IRealtimePort, SOCKET_IO_REDIS_KEY } from './port';

export type AttachSocketIoOpts = {
  jwtSecret: string;
  corsOrigins: string[];
  redisUrl?: string;
};

export const attachSocketIoRealtime = (
  httpServer: HttpServer,
  opts: AttachSocketIoOpts,
): IRealtimePort => {
  const io = new Server(httpServer, {
    cors: { origin: opts.corsOrigins, credentials: true },
  });
  let pub: Redis | undefined;
  let sub: Redis | undefined;
  if (opts.redisUrl) {
    pub = new Redis(opts.redisUrl, { maxRetriesPerRequest: null });
    sub = pub.duplicate();
    io.adapter(createAdapter(pub, sub, { key: SOCKET_IO_REDIS_KEY }));
  }
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (typeof token !== 'string') {
      next(new Error('unauthorized'));
      return;
    }
    try {
      const claims = await verifyAccessToken(token, opts.jwtSecret);
      socket.data.userId = claims.sub;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });
  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;
    void socket.join(`user:${userId}`);
  });
  return {
    async emitToUser(userId, event, payload) {
      io.to(`user:${userId}`).emit(event, payload);
    },
    async close() {
      await io.close();
      await pub?.quit();
      await sub?.quit();
    },
  };
};
