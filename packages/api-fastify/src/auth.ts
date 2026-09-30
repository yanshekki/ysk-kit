import { isApiKeyToken } from '@ysk-kit/apikey';
import type { AccessClaims } from '@ysk-kit/auth';
import { verifyAccessToken } from '@ysk-kit/auth';
import type { FastifyInstance } from 'fastify';

export type ApiKeyLookup = (token: string) => Promise<AccessClaims | null>;

declare module 'fastify' {
  interface FastifyRequest {
    auth?: AccessClaims | null;
  }
}

export const registerOptionalJwt = (
  app: FastifyInstance,
  secret: string,
  lookupApiKey?: ApiKeyLookup,
): void => {
  app.decorateRequest('auth', null);
  app.addHook('onRequest', async (req) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return;
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
  });
};
