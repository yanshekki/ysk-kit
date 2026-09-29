import cors from '@fastify/cors';
import { mountFastify, registerErrorHandler, registerOptionalJwt } from '@ysk/api-fastify';
import {
  applySecurityHeaders,
  buildOpenApiDocument,
  clientIp,
  createMemoryRateLimit,
  REQUEST_ID_HEADER,
  scalarDocsHtml,
} from '@ysk/api-http';
import { appContract, claimsHasPermission, LlmCompleteCommandSchema } from '@ysk/contracts';
import { AppError } from '@ysk/domain-kernel';
import Fastify, { type FastifyInstance } from 'fastify';
import type { CreateAppInput } from './app';
import { healthHandlers } from './health-handlers';
import { apiKeyHandlers } from './modules/api-keys/infra/api-key-router';
import { auditHandlers } from './modules/audit-log/infra/audit-router';
import { billingHandlers } from './modules/billing/infra/billing-router';
import { verifyStripeSignature } from './modules/billing/infra/stripe-billing';
import { deviceHandlers } from './modules/devices/infra/device-router';
import { fileHandlers } from './modules/files/infra/file-router';
import { authHandlers } from './modules/identity/infra/auth-router';
import { userHandlers } from './modules/identity/infra/user-router';
import { llmHandlers, writeLlmSse } from './modules/llm/infra/llm-router';
import { notificationHandlers } from './modules/notifications/infra/notification-router';
import { organizationHandlers } from './modules/organizations/infra/organization-router';
import { mountBullBoardFastify } from './mount-bull-board';

export const createFastifyApp = async (input: CreateAppInput): Promise<FastifyInstance> => {
  const app = Fastify({ logger: false });
  const production = input.production === true;
  const limiter = input.rateLimit ? createMemoryRateLimit(input.rateLimit) : undefined;
  await app.register(cors, { origin: input.corsOrigins });
  app.addHook('onRequest', async (req, reply) => {
    const id = String(req.headers[REQUEST_ID_HEADER] ?? crypto.randomUUID());
    req.headers[REQUEST_ID_HEADER] = id;
    void reply.header(REQUEST_ID_HEADER, id);
    const path = req.url.split('?')[0] ?? req.url;
    applySecurityHeaders(
      (name, value) => {
        void reply.header(name, value);
      },
      { production, ...(path === '/docs' ? { docs: true } : {}) },
    );
    limiter?.check(clientIp(req.headers['x-forwarded-for'], req.ip), path);
  });
  app.addHook('onResponse', async (req, reply) => {
    input.logger.info(
      {
        reqId: String(req.headers[REQUEST_ID_HEADER] ?? ''),
        method: req.method,
        url: req.url,
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime,
      },
      'request',
    );
  });
  registerOptionalJwt(app, input.jwtSecret, input.resolveApiKey);
  registerErrorHandler(app);
  app.get('/openapi.json', async (_req, reply) => reply.send(buildOpenApiDocument(appContract)));
  app.get('/docs', async (_req, reply) => reply.type('text/html').send(scalarDocsHtml()));

  if (input.stripeWebhookSecret) {
    const webhookSecret = input.stripeWebhookSecret;
    await app.register(async (scope) => {
      scope.addContentTypeParser('application/json', { parseAs: 'buffer' }, (_req, body, done) => {
        done(null, body);
      });
      scope.post('/v1/billing/webhook', async (req, reply) => {
        const event = verifyStripeSignature(
          Buffer.isBuffer(req.body) ? req.body : Buffer.from(String(req.body ?? '')),
          String(req.headers['stripe-signature'] ?? ''),
          webhookSecret,
        );
        if (event.type === 'checkout.session.completed') {
          const organizationId = event.data.object.metadata?.organizationId;
          const planCode = event.data.object.metadata?.planCode;
          const seatRaw = Number(event.data.object.metadata?.seatCount ?? '1');
          const seatCount = Number.isFinite(seatRaw) && seatRaw >= 1 ? Math.floor(seatRaw) : 1;
          if (organizationId && (planCode === 'pro' || planCode === 'free')) {
            const customer = event.data.object.customer;
            await input.billingService.activate(
              organizationId,
              planCode,
              typeof customer === 'string' ? customer : undefined,
              seatCount,
            );
          }
        }
        return reply.status(200).send({ ok: true, data: { received: true } });
      });
    });
  }

  mountFastify(app, appContract.health, healthHandlers(input.pingReady));
  mountFastify(app, appContract.auth, authHandlers(input.authService));
  mountFastify(app, appContract.users, userHandlers(input.userService));
  mountFastify(app, appContract.audit, auditHandlers(input.audit));
  mountFastify(app, appContract.files, fileHandlers(input.fileService));
  mountFastify(app, appContract.notifications, notificationHandlers(input.notificationService));
  mountFastify(app, appContract.llm, llmHandlers(input.llmService));
  mountFastify(app, appContract.devices, deviceHandlers(input.deviceService));
  mountFastify(app, appContract.organizations, organizationHandlers(input.organizationService));
  mountFastify(app, appContract.apiKeys, apiKeyHandlers(input.apiKeyService));
  mountFastify(app, appContract.billing, billingHandlers(input.billingService));
  app.get('/v1/billing/invoices/:id/pdf', async (req, reply) => {
    if (!req.auth) throw new AppError('UNAUTHENTICATED');
    if (!claimsHasPermission(req.auth, 'billing.checkout')) throw new AppError('FORBIDDEN');
    const url = await input.billingService.invoicePdf(
      req.auth.sub,
      String((req.query as { organizationId?: string }).organizationId ?? ''),
      String((req.params as { id?: string }).id ?? ''),
    );
    if (!url) throw new AppError('NOT_FOUND');
    return reply.redirect(url.url);
  });

  if (input.bullmqQueues) await mountBullBoardFastify(app, input.bullmqQueues);

  app.post('/v1/llm/stream', async (req, reply) => {
    if (!req.auth) throw new AppError('UNAUTHENTICATED');
    if (!claimsHasPermission(req.auth, 'llm.use')) throw new AppError('FORBIDDEN');
    const parsed = LlmCompleteCommandSchema.parse(req.body);
    reply.hijack();
    reply.raw.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    });
    await writeLlmSse(
      input.llmService,
      req.auth.sub,
      parsed,
      String(req.headers[REQUEST_ID_HEADER] ?? ''),
      (chunk) => {
        reply.raw.write(chunk);
      },
      () => {
        reply.raw.end();
      },
    );
  });

  if (input.allowLocalUpload && input.storage.putLocal) {
    const storage = input.storage;
    await app.register(async (scope) => {
      scope.addContentTypeParser('*', { parseAs: 'buffer' }, (_req, body, done) => {
        done(null, body);
      });
      scope.put('/v1/files/local/:key', async (req, reply) => {
        if (!req.auth) throw new AppError('UNAUTHENTICATED');
        const key = decodeURIComponent(String((req.params as { key: string }).key ?? ''));
        const mime = String(req.headers['content-type'] ?? 'application/octet-stream');
        const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from(String(req.body ?? ''));
        await storage.putLocal?.(key, body, mime);
        return reply.code(204).send();
      });
    });
  }

  if (input.metrics) {
    const register = input.metrics;
    app.get('/metrics', async (_req, reply) => {
      const body = await register.metrics();
      return reply.header('content-type', register.contentType).send(body);
    });
  }

  return app;
};
