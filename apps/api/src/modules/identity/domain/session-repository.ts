import type { Platform } from '@ysk/contracts';

export type SessionRecord = {
  id: string;
  userId: string;
  refreshHash: string;
  platform: Platform;
  expiresAt: Date;
  revokedAt: Date | null;
};

export interface ISessionRepository {
  create(input: {
    userId: string;
    refreshHash: string;
    platform: Platform;
    expiresAt: Date;
  }): Promise<SessionRecord>;
  findByRefreshHash(hash: string): Promise<SessionRecord | null>;
  revoke(id: string, at: Date): Promise<void>;
  revokeAllForUser(userId: string, at: Date): Promise<void>;
}
