import { slicePage } from '@ysk/application';
import type { MemberProfileDto, OrgRole } from '@ysk/contracts';
import type {
  IMemberProfileRepository,
  MemberProfileRecord,
} from '../domain/member-profile-repository';

const toDto = (row: MemberProfileRecord): MemberProfileDto => ({
  id: row.id,
  displayName: row.displayName,
  organizationId: row.organizationId,
  authorId: row.authorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export type MembershipLookup = {
  getMembership?: (userId: string, organizationId: string) => Promise<{ role: OrgRole } | null>;
  findMembership?: (organizationId: string, userId: string) => Promise<{ role: OrgRole } | null>;
};

export const createMemoryMemberProfileRepository = (lookup?: MembershipLookup) => {
  const rows: MemberProfileRecord[] = [];
  const memberships = new Map<string, { role: OrgRole }>();
  const membershipKey = (userId: string, organizationId: string) => `${userId}:${organizationId}`;

  const repo: IMemberProfileRepository = {
    async create(authorId, input) {
      const now = new Date();
      const row: MemberProfileRecord = {
        id: crypto.randomUUID(),
        displayName: input.displayName,
        organizationId: input.organizationId,
        authorId,
        createdAt: now,
        updatedAt: now,
      };
      rows.unshift(row);
      return toDto(row);
    },
    async listForAuthor(authorId, query) {
      const mine = rows.filter((row) => row.authorId === authorId);
      const page = slicePage(mine, query.limit);
      return { items: page.items.map(toDto), nextCursor: page.nextCursor };
    },
    async findByAuthorOrg(authorId, organizationId) {
      return (
        rows.find((row) => row.authorId === authorId && row.organizationId === organizationId) ??
        null
      );
    },
    async getMembership(userId, organizationId) {
      if (lookup?.getMembership) return lookup.getMembership(userId, organizationId);
      if (lookup?.findMembership) {
        const row = await lookup.findMembership(organizationId, userId);
        return row ? { role: row.role } : null;
      }
      return memberships.get(membershipKey(userId, organizationId)) ?? null;
    },
  };

  return Object.assign(repo, {
    seedMembership(userId: string, organizationId: string, role: OrgRole): void {
      memberships.set(membershipKey(userId, organizationId), { role });
    },
  });
};
