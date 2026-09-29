import {
  type ContractRouter,
  flattenContract,
  type HttpHandler,
  REQUEST_ID_HEADER,
} from '@ysk/api-http';
import type { AccessClaims } from '@ysk/auth';
import { claimsHasPermission } from '@ysk/contracts';
import { AppError } from '@ysk/domain-kernel';
import type { FastifyInstance, HTTPMethods } from 'fastify';

const normalize = (handler: HttpHandler | HttpHandler['handle']): HttpHandler =>
  typeof handler === 'function' ? { handle: handler } : handler;

const assertAuth = (
  handler: HttpHandler,
  auth: AccessClaims | undefined,
): AccessClaims | undefined => {
  if (handler.auth === 'required' || handler.permission) {
    if (!auth) throw new AppError('UNAUTHENTICATED');
    if (handler.permission && !claimsHasPermission(auth, handler.permission)) {
      throw new AppError('FORBIDDEN');
    }
    return auth;
  }
  return auth;
};

export const mountFastify = (
  app: FastifyInstance,
  contract: ContractRouter,
  handlers: Record<string, HttpHandler | HttpHandler['handle']>,
): void => {
  for (const { key, route } of flattenContract(contract)) {
    const raw = handlers[key];
    if (!raw) {
      throw new Error(`No handler registered for contract route ${key}`);
    }
    const handler = normalize(raw);
    app.route({
      method: route.method as HTTPMethods,
      url: route.path.replace(/:([A-Za-z0-9_]+)/g, ':$1'),
      handler: async (req, reply) => {
        const query = route.query ? route.query.parse(req.query) : req.query;
        const body = route.body ? route.body.parse(req.body) : req.body;
        const params = route.pathParams ? route.pathParams.parse(req.params) : req.params;
        const requestId = String(req.headers[REQUEST_ID_HEADER] ?? crypto.randomUUID());
        const auth = assertAuth(handler, req.auth ?? undefined);
        const result = await handler.handle({
          body,
          query,
          params,
          requestId,
          headers: req.headers as Record<string, string | string[] | undefined>,
          ...(auth ? { auth } : {}),
        });
        return reply.status(result.status).send(result.body);
      },
    });
  }
};
