import {
  type ApiKeyLookup,
  errorHandler,
  httpLogger,
  mountContract,
  optionalAuth,
  requestId,
  requireAuth,
  requirePermission,
} from '@ysk-kit/api-express';
import {
  applySecurityHeaders,
  buildOpenApiDocument,
  clientIp,
  createRateLimit,
  type RateLimitRedis,
  scalarDocsHtml,
} from '@ysk-kit/api-http';
import { appContract } from '@ysk-kit/contracts';
import { AppError } from '@ysk-kit/domain-kernel';
import type { BullmqQueue } from '@ysk-kit/jobs';
import type { Logger } from '@ysk-kit/logger';
import { mountMetrics, type Registry } from '@ysk-kit/observability';
import type { IStoragePort } from '@ysk-kit/storage';
import cors from 'cors';
import express, { type Express } from 'express';
import { healthHandlers } from './health-handlers';
import type { ApiKeyService } from './modules/api-keys/application/api-key-service';
import { registerApiKeyRoutes } from './modules/api-keys/infra/api-key-router';
import type { IAuditLogger } from './modules/audit-log/domain/audit-logger';
import { registerAuditRoutes } from './modules/audit-log/infra/audit-router';
import type { BillingService } from './modules/billing/application/billing-service';
import { registerBillingRoutes } from './modules/billing/infra/billing-router';
import { verifyStripeSignature } from './modules/billing/infra/stripe-billing';
import type { DeviceService } from './modules/devices/application/device-service';
import { registerDeviceRoutes } from './modules/devices/infra/device-router';
import type { FileService } from './modules/files/application/file-service';
import { registerFileRoutes } from './modules/files/infra/file-router';
import type { AuthService } from './modules/identity/application/auth-service';
import type { UserService } from './modules/identity/application/user-service';
import { registerAuthRoutes } from './modules/identity/infra/auth-router';
import { registerUserRoutes } from './modules/identity/infra/user-router';
import type { LlmService } from './modules/llm/application/llm-service';
import { registerLlmRoutes } from './modules/llm/infra/llm-router';
import type { NotificationService } from './modules/notifications/application/notification-service';
import { registerNotificationRoutes } from './modules/notifications/infra/notification-router';
import type { OrganizationService } from './modules/organizations/application/organization-service';
import { registerOrganizationRoutes } from './modules/organizations/infra/organization-router';
import { mountBullBoard } from './mount-bull-board';

export type CreateAppInput = {
  authService: AuthService;
  userService: UserService;
  fileService: FileService;
  notificationService: NotificationService;
  llmService: LlmService;
  deviceService: DeviceService;
  organizationService: OrganizationService;
  apiKeyService: ApiKeyService;
  billingService: BillingService;
  audit: IAuditLogger;
  storage: IStoragePort;
  logger: Logger;
  corsOrigins: string[];
  jwtSecret: string;
  resolveApiKey?: ApiKeyLookup;
  pingReady: () => Promise<boolean>;
  metrics?: Registry;
  allowLocalUpload?: boolean;
  bullmqQueues?: BullmqQueue[];
  stripeWebhookSecret?: string;
  production?: boolean;
  rateLimit?: { windowMs: number; max: number; redis?: RateLimitRedis };
};

export const createApp = (input: CreateAppInput): Express => {
  const app = express();
  const production = input.production === true;
  app.use(requestId);
  app.use(httpLogger(input.logger));
  app.use((req, res, next) => {
    applySecurityHeaders(
      (name, value) => {
        res.setHeader(name, value);
      },
      { production, ...(req.path === '/docs' ? { docs: true } : {}) },
    );
    next();
  });
  if (input.rateLimit) {
    const limiter = createRateLimit(input.rateLimit);
    app.use((req, _res, next) => {
      Promise.resolve()
        .then(() =>
          limiter.check(
            clientIp(req.headers['x-forwarded-for'], req.socket.remoteAddress),
            req.path,
          ),
        )
        .then(() => next())
        .catch(next);
    });
  }
  app.use(cors({ origin: input.corsOrigins }));
  app.get('/openapi.json', (_req, res) => {
    res.json(buildOpenApiDocument(appContract));
  });
  app.get('/docs', (_req, res) => {
    res.type('html').send(scalarDocsHtml());
  });
  if (input.stripeWebhookSecret) {
    const webhookSecret = input.stripeWebhookSecret;
    app.post('/v1/billing/webhook', express.raw({ type: '*/*' }), async (req, res, next) => {
      try {
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
        res.status(200).json({ ok: true, data: { received: true } });
      } catch (error) {
        next(error);
      }
    });
  }
  app.use(express.json({ limit: '2mb' }));
  app.use(optionalAuth(input.jwtSecret, input.resolveApiKey));

  mountContract(app, appContract.health, healthHandlers(input.pingReady));

  registerAuthRoutes(app, input.authService);
  registerUserRoutes(app, input.userService);
  registerAuditRoutes(app, input.audit);
  registerFileRoutes(app, input.fileService);
  registerNotificationRoutes(app, input.notificationService);
  registerLlmRoutes(app, input.llmService);
  registerDeviceRoutes(app, input.deviceService);
  registerOrganizationRoutes(app, input.organizationService);
  registerApiKeyRoutes(app, input.apiKeyService);
  registerBillingRoutes(app, input.billingService);
  app.get(
    '/v1/billing/invoices/:id/pdf',
    requireAuth,
    requirePermission('billing.checkout'),
    async (req, res, next) => {
      try {
        const url = await input.billingService.invoicePdf(
          req.auth?.sub ?? '',
          String(req.query.organizationId ?? ''),
          String(req.params.id ?? ''),
        );
        if (!url) throw new AppError('NOT_FOUND');
        res.redirect(302, url.url);
      } catch (error) {
        next(error);
      }
    },
  );
  if (input.bullmqQueues) mountBullBoard(app, input.bullmqQueues);

  if (input.allowLocalUpload && input.storage.putLocal && input.storage.getLocal) {
    const storage = input.storage;
    app.put(
      '/v1/files/local/:key',
      express.raw({ type: '*/*', limit: '20mb' }),
      async (req, res, next) => {
        try {
          if (!req.auth) throw new AppError('UNAUTHENTICATED');
          const key = decodeURIComponent(String(req.params.key ?? ''));
          const mime = String(req.headers['content-type'] ?? 'application/octet-stream');
          const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body ?? []);
          await storage.putLocal?.(key, body, mime);
          res.status(204).end();
        } catch (error) {
          next(error);
        }
      },
    );
  }

  if (input.metrics) mountMetrics(app, input.metrics);
  app.use(errorHandler);
  return app;
};
