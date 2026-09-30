import {
  type HttpHandler,
  mountContract,
  requireAuth,
  requirePermission,
} from '@ysk-kit/api-express';
import { appContract, type LlmCompleteCommand, LlmCompleteCommandSchema } from '@ysk-kit/contracts';
import { AppError } from '@ysk-kit/domain-kernel';
import type { Express } from 'express';
import type { LlmService } from '../application/llm-service';

export const llmHandlers = (service: LlmService): Record<string, HttpHandler> => ({
  complete: {
    auth: 'required',
    permission: 'llm.use',
    handle: async ({ body, auth, requestId }) => {
      if (!auth) throw new AppError('UNAUTHENTICATED');
      return {
        status: 200,
        body: {
          ok: true,
          data: await service.complete(auth.sub, body as LlmCompleteCommand, requestId),
        },
      };
    },
  },
  models: {
    auth: 'required',
    permission: 'llm.use',
    handle: async () => ({
      status: 200,
      body: { ok: true, data: service.models() },
    }),
  },
});

export const writeLlmSse = async (
  service: LlmService,
  userId: string,
  command: LlmCompleteCommand,
  requestId: string,
  write: (chunk: string) => void,
  end: () => void,
): Promise<void> => {
  for await (const chunk of service.stream(userId, command, requestId)) {
    const event = chunk.done ? 'done' : 'delta';
    write(`event: ${event}\ndata: ${JSON.stringify(chunk)}\n\n`);
  }
  end();
};

export const registerLlmRoutes = (app: Express, service: LlmService): void => {
  mountContract(app, appContract.llm, llmHandlers(service));

  app.post('/v1/llm/stream', requireAuth, requirePermission('llm.use'), async (req, res, next) => {
    try {
      const parsed = LlmCompleteCommandSchema.parse(req.body);
      const userId = req.auth?.sub;
      if (!userId) {
        res.status(401).json({
          ok: false,
          error: { code: 'UNAUTHENTICATED', message: '尚未登入' },
        });
        return;
      }
      res.status(200);
      res.setHeader('content-type', 'text/event-stream');
      res.setHeader('cache-control', 'no-cache, no-transform');
      res.setHeader('connection', 'keep-alive');
      res.setHeader('x-accel-buffering', 'no');
      res.flushHeaders?.();
      await writeLlmSse(
        service,
        userId,
        parsed,
        String(req.headers['x-request-id'] ?? ''),
        (chunk) => {
          res.write(chunk);
        },
        () => {
          res.end();
        },
      );
    } catch (error) {
      next(error);
    }
  });
};
