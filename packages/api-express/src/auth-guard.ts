import { isApiKeyToken } from '@ysk/apikey';
import type { AccessClaims } from '@ysk/auth';
import { verifyAccessToken } from '@ysk/auth';
import { claimsHasPermission, type Permission } from '@ysk/contracts';
import { AppError } from '@ysk/domain-kernel';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

export type AuthContext = AccessClaims;

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export type ApiKeyLookup = (token: string) => Promise<AccessClaims | null>;

export const optionalAuth =
  (secret: string, lookupApiKey?: ApiKeyLookup): RequestHandler =>
  async (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      next();
      return;
    }
    const token = header.slice('Bearer '.length);
    try {
      if (isApiKeyToken(token)) {
        const claims = lookupApiKey ? await lookupApiKey(token) : null;
        if (claims) req.auth = claims;
        else delete req.auth;
      } else {
        req.auth = await verifyAccessToken(token, secret);
      }
    } catch {
      delete req.auth;
    }
    next();
  };

export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.auth) {
    next(new AppError('UNAUTHENTICATED'));
    return;
  }
  next();
};

export const requirePermission =
  (permission: Permission): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      next(new AppError('UNAUTHENTICATED'));
      return;
    }
    if (!claimsHasPermission(req.auth, permission)) {
      next(new AppError('FORBIDDEN'));
      return;
    }
    next();
  };
