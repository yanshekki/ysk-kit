import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { FastifyAdapter } from '@bull-board/fastify';
import type { AccessClaims } from '@ysk-kit/auth';
import { ERROR_MESSAGE } from '@ysk-kit/contracts';
import type { BullmqQueue } from '@ysk-kit/jobs';
import type { Express, RequestHandler } from 'express';
import type { FastifyInstance } from 'fastify';

export const BULL_BOARD_PATH = '/admin/queues';

const unauthenticated = {
  ok: false as const,
  error: {
    code: 'UNAUTHENTICATED' as const,
    message: ERROR_MESSAGE.UNAUTHENTICATED['zh-HK'],
  },
};

const forbidden = {
  ok: false as const,
  error: { code: 'FORBIDDEN' as const, message: ERROR_MESSAGE.FORBIDDEN['zh-HK'] },
};

const adminDenied = (auth: AccessClaims | null | undefined) => {
  if (!auth) return { status: 401 as const, body: unauthenticated };
  if (auth.role !== 'ADMIN') return { status: 403 as const, body: forbidden };
  return null;
};

const requireAdmin: RequestHandler = (req, res, next) => {
  const denied = adminDenied(req.auth);
  if (denied) {
    res.status(denied.status).json(denied.body);
    return;
  }
  next();
};

export const mountBullBoard = (app: Express, queues: BullmqQueue[]): void => {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath(BULL_BOARD_PATH);
  createBullBoard({
    queues: queues.map((queue) => new BullMQAdapter(queue)),
    serverAdapter,
  });
  app.use(BULL_BOARD_PATH, requireAdmin, serverAdapter.getRouter());
};

export const mountBullBoardFastify = async (
  app: FastifyInstance,
  queues: BullmqQueue[],
): Promise<void> => {
  const serverAdapter = new FastifyAdapter();
  serverAdapter.setBasePath(BULL_BOARD_PATH);
  createBullBoard({
    queues: queues.map((queue) => new BullMQAdapter(queue)),
    serverAdapter,
  });
  await app.register(
    async (scope) => {
      scope.addHook('onRequest', async (req, reply) => {
        const denied = adminDenied(req.auth);
        if (denied) {
          return reply.status(denied.status).send(denied.body);
        }
      });
      await scope.register(serverAdapter.registerPlugin());
    },
    { prefix: BULL_BOARD_PATH },
  );
};
