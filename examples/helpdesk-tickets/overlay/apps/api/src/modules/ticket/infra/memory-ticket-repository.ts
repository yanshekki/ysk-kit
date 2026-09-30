import { slicePage } from '@ysk/application';
import type { OrgRole, TicketDto, TicketStatus } from '@ysk/contracts';
import type { ITicketRepository, TicketRecord } from '../domain/ticket-repository';

const toDto = (row: TicketRecord): TicketDto => ({
  id: row.id,
  title: row.title,
  body: row.body,
  organizationId: row.organizationId,
  status: row.status,
  authorId: row.authorId,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export type MembershipLookup = {
  getMembership?: (userId: string, organizationId: string) => Promise<{ role: OrgRole } | null>;
  findMembership?: (organizationId: string, userId: string) => Promise<{ role: OrgRole } | null>;
};

export const createMemoryTicketRepository = (lookup?: MembershipLookup) => {
  const rows: TicketRecord[] = [];
  const memberships = new Map<string, { role: OrgRole }>();
  const membershipKey = (userId: string, organizationId: string) => `${userId}:${organizationId}`;

  const repo: ITicketRepository = {
    async create(authorId, input) {
      const now = new Date();
      const row: TicketRecord = {
        id: crypto.randomUUID(),
        title: input.title,
        body: input.body,
        organizationId: input.organizationId,
        status: 'OPEN',
        authorId,
        createdAt: now,
        updatedAt: now,
      };
      rows.unshift(row);
      return toDto(row);
    },
    async listForOrganization(organizationId, query) {
      const mine = rows.filter((row) => row.organizationId === organizationId);
      const page = slicePage(mine, query.limit);
      return { items: page.items.map(toDto), nextCursor: page.nextCursor };
    },
    async getById(id) {
      return rows.find((row) => row.id === id) ?? null;
    },
    async updateStatus(id, status: TicketStatus) {
      const row = rows.find((item) => item.id === id);
      if (!row) throw new Error(`ticket ${id} missing`);
      row.status = status;
      row.updatedAt = new Date();
      return toDto(row);
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
