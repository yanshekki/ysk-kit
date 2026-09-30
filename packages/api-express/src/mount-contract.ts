import {
  type ContractRouter,
  flattenContract,
  type HttpHandler,
  type HttpResult,
  REQUEST_ID_HEADER,
} from '@ysk-kit/api-http';
import type { AccessClaims } from '@ysk-kit/auth';
import { claimsHasPermission } from '@ysk-kit/contracts';
import { AppError } from '@ysk-kit/domain-kernel';
import type { Express } from 'express';

export { type ContractRouter, flattenContract } from '@ysk-kit/api-http';
export type RouteResult = HttpResult;
export type MountedHandler = HttpHandler | HttpHandler['handle'];

const toExpressPath = (path: string): string => path.replace(/:([A-Za-z0-9_]+)/g, ':$1');

const normalize = (handler: MountedHandler): HttpHandler =>
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

export const mountContract = (
  app: Express,
  contract: ContractRouter,
  handlers: Record<string, MountedHandler>,
): void => {
  for (const { key, route } of flattenContract(contract)) {
    const raw = handlers[key];
    if (!raw) {
      throw new Error(`No handler registered for contract route ${key}`);
    }
    const handler = normalize(raw);
    const method = route.method.toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete';
    app[method](toExpressPath(route.path), async (req, res, next) => {
      try {
        const query = route.query ? route.query.parse(req.query) : req.query;
        const body = route.body ? route.body.parse(req.body) : req.body;
        const params = route.pathParams ? route.pathParams.parse(req.params) : req.params;
        const requestId = String(req.headers[REQUEST_ID_HEADER] ?? crypto.randomUUID());
        const auth = assertAuth(handler, req.auth);
        const result = await handler.handle({
          body,
          query,
          params,
          requestId,
          headers: req.headers as Record<string, string | string[] | undefined>,
          ...(auth ? { auth } : {}),
        });
        res.status(result.status).json(result.body);
      } catch (error) {
        next(error);
      }
    });
  }
};
