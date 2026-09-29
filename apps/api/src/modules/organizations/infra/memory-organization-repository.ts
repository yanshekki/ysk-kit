import type {
  IOrganizationRepository,
  MembershipRecord,
  OrganizationRecord,
  OrgInviteRecord,
} from '../domain/organization-repository';

export const createMemoryOrganizationRepository = (): IOrganizationRepository => {
  const orgs: OrganizationRecord[] = [];
  const members: MembershipRecord[] = [];
  const invites: OrgInviteRecord[] = [];

  return {
    async createWithOwner(input) {
      const org: OrganizationRecord = {
        id: crypto.randomUUID(),
        name: input.name,
        stripeCustomerId: null,
        createdAt: new Date(),
      };
      orgs.unshift(org);
      members.push({
        id: crypto.randomUUID(),
        organizationId: org.id,
        userId: input.ownerUserId,
        role: 'OWNER',
        createdAt: new Date(),
      });
      return org;
    },
    async findById(id) {
      return orgs.find((row) => row.id === id) ?? null;
    },
    async listForUser(userId) {
      const orgIds = new Set(
        members.filter((row) => row.userId === userId).map((row) => row.organizationId),
      );
      return orgs.filter((org) => orgIds.has(org.id));
    },
    async updateName(id, name) {
      const org = orgs.find((row) => row.id === id);
      if (!org) throw new Error(`organization ${id} missing`);
      org.name = name;
      return org;
    },
    async setStripeCustomerId(id, customerId) {
      const org = orgs.find((row) => row.id === id);
      if (!org) throw new Error(`organization ${id} missing`);
      org.stripeCustomerId = customerId;
      return org;
    },
    async findMembership(organizationId, userId) {
      return (
        members.find((row) => row.organizationId === organizationId && row.userId === userId) ??
        null
      );
    },
    async listMembers(organizationId) {
      return members.filter((row) => row.organizationId === organizationId);
    },
    async addMembership(input) {
      const existing = members.find(
        (row) => row.organizationId === input.organizationId && row.userId === input.userId,
      );
      if (existing) return existing;
      const row: MembershipRecord = { id: crypto.randomUUID(), createdAt: new Date(), ...input };
      members.push(row);
      return row;
    },
    async removeMembership(organizationId, userId) {
      const index = members.findIndex(
        (row) => row.organizationId === organizationId && row.userId === userId,
      );
      if (index < 0) return false;
      members.splice(index, 1);
      return true;
    },
    async countOwners(organizationId) {
      return members.filter((row) => row.organizationId === organizationId && row.role === 'OWNER')
        .length;
    },
    async upsertPendingInvite(input) {
      const email = input.email.toLowerCase();
      const existing = invites.find(
        (row) =>
          row.organizationId === input.organizationId &&
          row.email === email &&
          row.acceptedAt === null,
      );
      if (existing) {
        existing.role = input.role;
        existing.tokenHash = input.tokenHash;
        existing.expiresAt = input.expiresAt;
        existing.invitedById = input.invitedById;
        return existing;
      }
      const row: OrgInviteRecord = {
        id: crypto.randomUUID(),
        createdAt: new Date(),
        acceptedAt: null,
        ...input,
        email,
      };
      invites.push(row);
      return row;
    },
    async findPendingInviteByEmail(organizationId, email) {
      const normalized = email.toLowerCase();
      return (
        invites.find(
          (row) =>
            row.organizationId === organizationId &&
            row.email === normalized &&
            row.acceptedAt === null,
        ) ?? null
      );
    },
    async findInviteByTokenHash(tokenHash) {
      return invites.find((row) => row.tokenHash === tokenHash) ?? null;
    },
    async listPendingInvites(organizationId) {
      return invites.filter(
        (row) => row.organizationId === organizationId && row.acceptedAt === null,
      );
    },
    async markInviteAccepted(id, at) {
      const row = invites.find((item) => item.id === id);
      if (row) row.acceptedAt = at;
    },
    async deleteInvite(id, organizationId) {
      const index = invites.findIndex(
        (row) => row.id === id && row.organizationId === organizationId && row.acceptedAt === null,
      );
      if (index < 0) return false;
      invites.splice(index, 1);
      return true;
    },
  };
};

export type MemoryOrganizationRepository = ReturnType<typeof createMemoryOrganizationRepository>;
