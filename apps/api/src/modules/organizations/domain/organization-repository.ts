import type { InviteOrgRole, OrgRole } from '@ysk/contracts';

export type OrganizationRecord = {
  id: string;
  name: string;
  stripeCustomerId: string | null;
  createdAt: Date;
};

export type MembershipRecord = {
  id: string;
  organizationId: string;
  userId: string;
  role: OrgRole;
  createdAt: Date;
};

export type OrgInviteRecord = {
  id: string;
  organizationId: string;
  email: string;
  role: InviteOrgRole;
  tokenHash: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  invitedById: string;
  createdAt: Date;
};

export interface IOrganizationRepository {
  createWithOwner(input: { name: string; ownerUserId: string }): Promise<OrganizationRecord>;
  findById(id: string): Promise<OrganizationRecord | null>;
  listForUser(userId: string): Promise<OrganizationRecord[]>;
  updateName(id: string, name: string): Promise<OrganizationRecord>;
  setStripeCustomerId(id: string, customerId: string): Promise<OrganizationRecord>;
  findMembership(organizationId: string, userId: string): Promise<MembershipRecord | null>;
  listMembers(organizationId: string): Promise<MembershipRecord[]>;
  addMembership(input: {
    organizationId: string;
    userId: string;
    role: OrgRole;
  }): Promise<MembershipRecord>;
  removeMembership(organizationId: string, userId: string): Promise<boolean>;
  countOwners(organizationId: string): Promise<number>;
  upsertPendingInvite(input: {
    organizationId: string;
    email: string;
    role: InviteOrgRole;
    tokenHash: string;
    expiresAt: Date;
    invitedById: string;
  }): Promise<OrgInviteRecord>;
  findPendingInviteByEmail(organizationId: string, email: string): Promise<OrgInviteRecord | null>;
  findInviteByTokenHash(tokenHash: string): Promise<OrgInviteRecord | null>;
  listPendingInvites(organizationId: string): Promise<OrgInviteRecord[]>;
  markInviteAccepted(id: string, at: Date): Promise<void>;
  deleteInvite(id: string, organizationId: string): Promise<boolean>;
}
