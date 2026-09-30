import type { InviteOrgRole } from '@ysk-kit/contracts';
import type { Organization, OrgInvite, PrismaClient } from '../../../generated/prisma/client';
import type {
  IOrganizationRepository,
  OrganizationRecord,
  OrgInviteRecord,
} from '../domain/organization-repository';

const toOrg = (row: Organization): OrganizationRecord => ({
  id: row.id,
  name: row.name,
  stripeCustomerId: row.stripeCustomerId,
  createdAt: row.createdAt,
});

const toInviteRole = (role: OrgInvite['role']): InviteOrgRole =>
  role === 'ADMIN' ? 'ADMIN' : 'MEMBER';

const toInvite = (row: OrgInvite): OrgInviteRecord => ({
  id: row.id,
  organizationId: row.organizationId,
  email: row.email,
  role: toInviteRole(row.role),
  tokenHash: row.tokenHash,
  expiresAt: row.expiresAt,
  acceptedAt: row.acceptedAt,
  invitedById: row.invitedById,
  createdAt: row.createdAt,
});

export const createPrismaOrganizationRepository = (
  prisma: PrismaClient,
): IOrganizationRepository => ({
  async createWithOwner(input) {
    const row = await prisma.organization.create({
      data: {
        name: input.name,
        members: { create: { userId: input.ownerUserId, role: 'OWNER' } },
      },
    });
    return toOrg(row);
  },
  async findById(id) {
    const row = await prisma.organization.findUnique({ where: { id } });
    return row ? toOrg(row) : null;
  },
  async listForUser(userId) {
    const rows = await prisma.organization.findMany({
      where: { members: { some: { userId } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toOrg);
  },
  async updateName(id, name) {
    const row = await prisma.organization.update({ where: { id }, data: { name } });
    return toOrg(row);
  },
  async setStripeCustomerId(id, customerId) {
    const row = await prisma.organization.update({
      where: { id },
      data: { stripeCustomerId: customerId },
    });
    return toOrg(row);
  },
  async findMembership(organizationId, userId) {
    return prisma.membership.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
  },
  async listMembers(organizationId) {
    return prisma.membership.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
    });
  },
  async addMembership(input) {
    return prisma.membership.create({ data: input });
  },
  async removeMembership(organizationId, userId) {
    try {
      await prisma.membership.delete({
        where: { organizationId_userId: { organizationId, userId } },
      });
      return true;
    } catch {
      return false;
    }
  },
  async countOwners(organizationId) {
    return prisma.membership.count({ where: { organizationId, role: 'OWNER' } });
  },
  async upsertPendingInvite(input) {
    const email = input.email.toLowerCase();
    const existing = await prisma.orgInvite.findFirst({
      where: { organizationId: input.organizationId, email, acceptedAt: null },
    });
    if (existing) {
      const row = await prisma.orgInvite.update({
        where: { id: existing.id },
        data: {
          role: input.role,
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
          invitedById: input.invitedById,
        },
      });
      return toInvite(row);
    }
    const row = await prisma.orgInvite.create({
      data: { ...input, email },
    });
    return toInvite(row);
  },
  async findPendingInviteByEmail(organizationId, email) {
    const row = await prisma.orgInvite.findFirst({
      where: { organizationId, email: email.toLowerCase(), acceptedAt: null },
    });
    return row ? toInvite(row) : null;
  },
  async findInviteByTokenHash(tokenHash) {
    const row = await prisma.orgInvite.findUnique({ where: { tokenHash } });
    return row ? toInvite(row) : null;
  },
  async listPendingInvites(organizationId) {
    const rows = await prisma.orgInvite.findMany({
      where: { organizationId, acceptedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toInvite);
  },
  async markInviteAccepted(id, at) {
    await prisma.orgInvite.update({ where: { id }, data: { acceptedAt: at } });
  },
  async deleteInvite(id, organizationId) {
    const row = await prisma.orgInvite.findFirst({
      where: { id, organizationId, acceptedAt: null },
    });
    if (!row) return false;
    await prisma.orgInvite.delete({ where: { id } });
    return true;
  },
});
