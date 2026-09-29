import { slicePage } from '@ysk/application';
import { AppError } from '@ysk/domain-kernel';
import type { IAuditLogger } from '../../audit-log/domain/audit-logger';
import type { IOtpRepository, OtpRecord } from '../domain/otp-repository';
import type { IOtpSender } from '../domain/otp-sender';
import type { ISessionRepository, SessionRecord } from '../domain/session-repository';
import type { UserRecord } from '../domain/user';
import type { IUserRepository } from '../domain/user-repository';
import { toUserDto } from './user-mapper';

export const createMemoryUserRepository = (seed: UserRecord[] = []): IUserRepository => {
  const rows = [...seed];
  return {
    async findById(id) {
      return rows.find((row) => row.id === id) ?? null;
    },
    async findByEmail(email) {
      return rows.find((row) => row.email === email) ?? null;
    },
    async findByPhone(phone) {
      return rows.find((row) => row.phone === phone) ?? null;
    },
    async list(query) {
      const page = slicePage(rows, query.limit);
      return { items: page.items.map(toUserDto), nextCursor: page.nextCursor };
    },
    async create(input) {
      if (input.email && rows.some((row) => row.email === input.email)) {
        throw new AppError('CONFLICT', 'Account already exists');
      }
      if (input.phone && rows.some((row) => row.phone === input.phone)) {
        throw new AppError('CONFLICT', 'Account already exists');
      }
      const user: UserRecord = {
        id: crypto.randomUUID(),
        email: input.email ?? null,
        phone: input.phone ?? null,
        displayName: input.displayName,
        role: input.role,
        status: input.status ?? 'ACTIVE',
        passwordHash: input.passwordHash ?? null,
        createdAt: new Date(),
      };
      rows.unshift(user);
      return user;
    },
    async save(user) {
      const index = rows.findIndex((row) => row.id === user.id);
      if (index >= 0) rows[index] = user;
      else rows.unshift(user);
      return user;
    },
  };
};

export const createMemorySessionRepository = (): ISessionRepository => {
  const rows: SessionRecord[] = [];
  return {
    async create(input) {
      const row: SessionRecord = { id: crypto.randomUUID(), revokedAt: null, ...input };
      rows.push(row);
      return row;
    },
    async findByRefreshHash(hash) {
      return rows.find((row) => row.refreshHash === hash) ?? null;
    },
    async revoke(id, at) {
      const row = rows.find((item) => item.id === id);
      if (row) row.revokedAt = at;
    },
    async revokeAllForUser(userId, at) {
      for (const row of rows) {
        if (row.userId === userId && !row.revokedAt) row.revokedAt = at;
      }
    },
  };
};

export const createMemoryOtpRepository = (): IOtpRepository => {
  const rows: OtpRecord[] = [];
  return {
    async create(input) {
      const row: OtpRecord = {
        id: crypto.randomUUID(),
        attempts: 0,
        consumedAt: null,
        createdAt: new Date(),
        ...input,
      };
      rows.push(row);
      return row;
    },
    async findLatestOpen(phone) {
      return (
        [...rows].reverse().find((row) => row.phone === phone && row.consumedAt === null) ?? null
      );
    },
    async incrementAttempts(id) {
      const row = rows.find((item) => item.id === id);
      if (!row) return null;
      row.attempts += 1;
      return row;
    },
    async consume(id, at) {
      const row = rows.find((item) => item.id === id);
      if (row) row.consumedAt = at;
    },
    async countSince(phone, since) {
      return rows.filter((row) => row.phone === phone && row.createdAt >= since).length;
    },
  };
};

export const createMemoryAuditLogger = (): IAuditLogger & { entries: unknown[] } => {
  const entries: Array<{
    id: string;
    actorId: string | null;
    action: string;
    resourceType: string;
    resourceId: string;
    createdAt: string;
  }> = [];
  return {
    entries,
    async record(input) {
      entries.unshift({
        id: crypto.randomUUID(),
        actorId: input.actorId,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        createdAt: new Date().toISOString(),
      });
    },
    async list(query) {
      const page = slicePage(
        entries.map((entry) => ({ ...entry, id: entry.id })),
        query.limit,
      );
      return {
        items: page.items.map((entry) => ({
          id: entry.id,
          actorId: entry.actorId,
          action: entry.action as never,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          createdAt: entry.createdAt,
        })),
        nextCursor: page.nextCursor,
      };
    },
  };
};

export const createSilentOtpSender = (sink: {
  last?: { phone: string; code: string };
}): IOtpSender => ({
  async send(phone, code) {
    sink.last = { phone, code };
  },
});
