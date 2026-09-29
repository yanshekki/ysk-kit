import type { Permission } from '@ysk/contracts';

export type ApiKeyRecord = {
  id: string;
  userId: string;
  name: string;
  prefix: string;
  last4: string;
  tokenHash: string;
  permissions: Permission[];
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
};

export interface IApiKeyRepository {
  create(input: {
    userId: string;
    name: string;
    prefix: string;
    last4: string;
    tokenHash: string;
    permissions: Permission[];
  }): Promise<ApiKeyRecord>;
  listForUser(userId: string): Promise<ApiKeyRecord[]>;
  findByPrefix(prefix: string): Promise<ApiKeyRecord | null>;
  findByIdForUser(id: string, userId: string): Promise<ApiKeyRecord | null>;
  markRevoked(id: string, at: Date): Promise<void>;
  touchLastUsed(id: string, at: Date): Promise<void>;
}
