import { hashesMatch, hashKey, last4Of, newApiKey, prefixOf } from '@ysk-kit/apikey';
import type { AccessClaims } from '@ysk-kit/auth';
import type { CreateApiKeyCommand } from '@ysk-kit/contracts';
import { ROLE_PERMISSIONS } from '@ysk-kit/contracts';
import { AppError } from '@ysk-kit/domain-kernel';
import type { IAuditLogger } from '../../audit-log/domain/audit-logger';
import type { IUserRepository } from '../../identity/domain/user-repository';
import type { ApiKeyRecord, IApiKeyRepository } from '../domain/api-key-repository';

const toDto = (row: ApiKeyRecord) => ({
  id: row.id,
  name: row.name,
  prefix: row.prefix,
  last4: row.last4,
  permissions: row.permissions,
  createdAt: row.createdAt.toISOString(),
  lastUsedAt: row.lastUsedAt ? row.lastUsedAt.toISOString() : null,
});

export const createApiKeyService = (opts: {
  keys: IApiKeyRepository;
  users: IUserRepository;
  audit: IAuditLogger;
}) => {
  const assertSession = (claims: AccessClaims) => {
    if (claims.platform === 'api') throw new AppError('FORBIDDEN', 'API keys cannot manage keys');
  };

  return {
    list: async (claims: AccessClaims) => {
      assertSession(claims);
      const rows = await opts.keys.listForUser(claims.sub);
      return rows.map(toDto);
    },

    create: async (claims: AccessClaims, body: CreateApiKeyCommand) => {
      assertSession(claims);
      const owner = await opts.users.findById(claims.sub);
      if (!owner || owner.status !== 'ACTIVE') throw new AppError('FORBIDDEN');
      const allowed = new Set(ROLE_PERMISSIONS[owner.role]);
      if (!body.permissions.every((item) => allowed.has(item))) {
        throw new AppError('FORBIDDEN', 'Permissions exceed your role');
      }
      const token = newApiKey();
      const row = await opts.keys.create({
        userId: owner.id,
        name: body.name,
        prefix: prefixOf(token),
        last4: last4Of(token),
        tokenHash: hashKey(token),
        permissions: body.permissions,
      });
      await opts.audit.record({
        actorId: owner.id,
        action: 'api_key.create',
        resourceType: 'api_key',
        resourceId: row.id,
      });
      return {
        ...toDto(row),
        token,
      };
    },

    revoke: async (claims: AccessClaims, id: string) => {
      assertSession(claims);
      const row = await opts.keys.findByIdForUser(id, claims.sub);
      if (!row) throw new AppError('NOT_FOUND');
      await opts.keys.markRevoked(id, new Date());
      await opts.audit.record({
        actorId: claims.sub,
        action: 'api_key.revoke',
        resourceType: 'api_key',
        resourceId: id,
      });
      return { revoked: true as const };
    },

    resolveToken: async (raw: string): Promise<AccessClaims | null> => {
      const row = await opts.keys.findByPrefix(prefixOf(raw));
      if (!row || row.revokedAt) return null;
      if (!hashesMatch(row.tokenHash, hashKey(raw))) return null;
      const owner = await opts.users.findById(row.userId);
      if (!owner || owner.status !== 'ACTIVE') return null;
      await opts.keys.touchLastUsed(row.id, new Date());
      const claims: AccessClaims = {
        sub: owner.id,
        role: owner.role,
        platform: 'api',
        sid: row.id,
        permissions: row.permissions,
      };
      return claims;
    },
  };
};

export type ApiKeyService = ReturnType<typeof createApiKeyService>;
