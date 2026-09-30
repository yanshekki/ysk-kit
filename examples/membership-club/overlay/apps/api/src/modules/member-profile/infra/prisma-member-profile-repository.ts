import { slicePage } from '@ysk-kit/application';
import type { MemberProfileDto, OrgRole } from '@ysk-kit/contracts';
import type { PrismaClient } from '../../../generated/prisma/client';
import type { IMemberProfileRepository } from '../domain/member-profile-repository';

const toDto = (row: {
  id: string;
  displayName: string;
  organizationId: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}): MemberProfileDto => ({
  id: row.id,
  displayName: row.displayName,
  organizationId: row.organizationId,
  authorId: row.authorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const createPrismaMemberProfileRepository = (
  prisma: PrismaClient,
): IMemberProfileRepository => ({
  async create(authorId, input) {
    const row = await prisma.memberProfile.create({
      data: {
        displayName: input.displayName,
        organizationId: input.organizationId,
        authorId,
      },
    });
    return toDto(row);
  },
  async listForAuthor(authorId, query) {
    const rows = await prisma.memberProfile.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const page = slicePage(rows, query.limit);
    return { items: page.items.map(toDto), nextCursor: page.nextCursor };
  },
  async findByAuthorOrg(authorId, organizationId) {
    const row = await prisma.memberProfile.findFirst({
      where: { authorId, organizationId },
    });
    return row ?? null;
  },
  async getMembership(userId, organizationId) {
    const row = await prisma.membership.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
    if (!row) return null;
    return { role: row.role as OrgRole };
  },
});
