import { slicePage } from '@ysk/application';
import type { AuditAction } from '@ysk/contracts';
import type { Prisma, PrismaClient } from '../../../generated/prisma/client';
import type { IAuditLogger } from '../domain/audit-logger';

export const createPrismaAuditLogger = (prisma: PrismaClient): IAuditLogger => ({
  async record(input) {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        ...(input.diff !== undefined ? { diff: input.diff as Prisma.InputJsonValue } : {}),
        ...(input.requestId ? { requestId: input.requestId } : {}),
      },
    });
  },
  async list(query) {
    const rows = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const page = slicePage(rows, query.limit);
    return {
      items: page.items.map((row) => ({
        id: row.id,
        actorId: row.actorId,
        action: row.action as AuditAction,
        resourceType: row.resourceType,
        resourceId: row.resourceId,
        createdAt: row.createdAt.toISOString(),
      })),
      nextCursor: page.nextCursor,
    };
  },
});
