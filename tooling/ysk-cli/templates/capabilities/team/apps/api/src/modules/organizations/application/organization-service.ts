import { hashPassword, hashRefresh, newRefreshToken } from '@ysk-kit/auth';
import type {
  AcceptInviteCommand,
  CreateOrganizationCommand,
  InviteMemberCommand,
  MembershipDto,
  OrganizationDto,
  OrgInviteDto,
  UpdateOrganizationCommand,
} from '@ysk-kit/contracts';
import { orgRoleCan } from '@ysk-kit/contracts';
import { AppError } from '@ysk-kit/domain-kernel';
import type { IJobQueue } from '@ysk-kit/jobs';
import type { IAuditLogger } from '../../audit-log/domain/audit-logger';
import type { IUserRepository } from '../../identity/domain/user-repository';
import type { IOrganizationRepository } from '../domain/organization-repository';

const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7;

const toOrgDto = (row: { id: string; name: string; createdAt: Date }): OrganizationDto => ({
  id: row.id,
  name: row.name,
  createdAt: row.createdAt.toISOString(),
});

const toInviteDto = (row: {
  id: string;
  organizationId: string;
  email: string;
  role: OrgInviteDto['role'];
  createdAt: Date;
  expiresAt: Date;
}): OrgInviteDto => ({
  id: row.id,
  organizationId: row.organizationId,
  email: row.email,
  role: row.role,
  createdAt: row.createdAt.toISOString(),
  expiresAt: row.expiresAt.toISOString(),
});

const displayNameFromEmail = (email: string): string => {
  const local = email.split('@')[0] ?? 'user';
  return local.slice(0, 80) || 'user';
};

export type OrganizationServiceDeps = {
  orgs: IOrganizationRepository;
  users: IUserRepository;
  jobs: IJobQueue;
  audit: IAuditLogger;
  webPublicUrl: string;
  now?: () => Date;
};

export const createOrganizationService = (deps: OrganizationServiceDeps) => {
  const now = () => deps.now?.() ?? new Date();

  const requireOrg = async (organizationId: string) => {
    const org = await deps.orgs.findById(organizationId);
    if (!org) throw new AppError('NOT_FOUND');
    return org;
  };

  const requireMember = async (organizationId: string, userId: string) => {
    await requireOrg(organizationId);
    const membership = await deps.orgs.findMembership(organizationId, userId);
    if (!membership) throw new AppError('FORBIDDEN');
    return membership;
  };

  const hydrateMember = async (row: {
    id: string;
    organizationId: string;
    userId: string;
    role: MembershipDto['role'];
    createdAt: Date;
  }): Promise<MembershipDto> => {
    const user = await deps.users.findById(row.userId);
    return {
      id: row.id,
      organizationId: row.organizationId,
      userId: row.userId,
      email: user?.email ?? null,
      displayName: user?.displayName ?? 'user',
      role: row.role,
      createdAt: row.createdAt.toISOString(),
    };
  };

  return {
    create: async (actorId: string, body: CreateOrganizationCommand): Promise<OrganizationDto> => {
      const org = await deps.orgs.createWithOwner({ name: body.name, ownerUserId: actorId });
      await deps.audit.record({
        actorId,
        action: 'org.create',
        resourceType: 'organization',
        resourceId: org.id,
      });
      return toOrgDto(org);
    },

    listMine: (actorId: string) =>
      deps.orgs.listForUser(actorId).then((rows) => rows.map(toOrgDto)),

    get: async (actorId: string, organizationId: string): Promise<OrganizationDto> => {
      const org = await requireOrg(organizationId);
      await requireMember(organizationId, actorId);
      return toOrgDto(org);
    },

    update: async (
      actorId: string,
      organizationId: string,
      body: UpdateOrganizationCommand,
    ): Promise<OrganizationDto> => {
      const membership = await requireMember(organizationId, actorId);
      if (!orgRoleCan(membership.role, 'org.update')) throw new AppError('FORBIDDEN');
      const org = await deps.orgs.updateName(organizationId, body.name);
      return toOrgDto(org);
    },

    members: async (actorId: string, organizationId: string): Promise<MembershipDto[]> => {
      await requireMember(organizationId, actorId);
      const rows = await deps.orgs.listMembers(organizationId);
      return Promise.all(rows.map(hydrateMember));
    },

    invite: async (
      actorId: string,
      organizationId: string,
      body: InviteMemberCommand,
    ): Promise<OrgInviteDto> => {
      const membership = await requireMember(organizationId, actorId);
      if (!orgRoleCan(membership.role, 'org.invite')) throw new AppError('FORBIDDEN');
      const org = await requireOrg(organizationId);
      const email = body.email.trim().toLowerCase();
      const existingUser = await deps.users.findByEmail(email);
      if (existingUser) {
        if (existingUser.status === 'SUSPENDED' || existingUser.status === 'DELETED') {
          throw new AppError('CONFLICT', 'Account cannot be invited');
        }
        const already = await deps.orgs.findMembership(organizationId, existingUser.id);
        if (already) throw new AppError('CONFLICT', 'Already a member');
      }
      const token = newRefreshToken();
      const invite = await deps.orgs.upsertPendingInvite({
        organizationId,
        email,
        role: body.role,
        tokenHash: hashRefresh(token),
        expiresAt: new Date(now().getTime() + INVITE_TTL_MS),
        invitedById: actorId,
      });
      let user = existingUser;
      if (!user) {
        user = await deps.users.create({
          email,
          displayName: displayNameFromEmail(email),
          role: 'USER',
          status: 'INVITED',
        });
      }
      await deps.jobs.enqueue('email.send', {
        to: email,
        template: 'org.invite',
        locale: 'zh-HK',
        vars: {
          organizationName: org.name,
          inviteUrl: `${deps.webPublicUrl}/invite?token=${token}`,
        },
      });
      await deps.jobs.enqueue('notification.create', {
        userId: user.id,
        type: 'org.invited',
        title: '組織邀請',
        body: `你被邀請加入 ${org.name}。`,
      });
      await deps.audit.record({
        actorId,
        action: 'org.invite',
        resourceType: 'organization',
        resourceId: organizationId,
      });
      return toInviteDto(invite);
    },

    invites: async (actorId: string, organizationId: string): Promise<OrgInviteDto[]> => {
      const membership = await requireMember(organizationId, actorId);
      if (!orgRoleCan(membership.role, 'org.invite')) throw new AppError('FORBIDDEN');
      const rows = await deps.orgs.listPendingInvites(organizationId);
      return rows.map(toInviteDto);
    },

    revokeInvite: async (actorId: string, organizationId: string, inviteId: string) => {
      const membership = await requireMember(organizationId, actorId);
      if (!orgRoleCan(membership.role, 'org.invite')) throw new AppError('FORBIDDEN');
      const ok = await deps.orgs.deleteInvite(inviteId, organizationId);
      if (!ok) throw new AppError('NOT_FOUND');
      return { removed: true as const };
    },

    removeMember: async (actorId: string, organizationId: string, userId: string) => {
      const membership = await requireMember(organizationId, actorId);
      if (!orgRoleCan(membership.role, 'org.member.remove')) throw new AppError('FORBIDDEN');
      const target = await deps.orgs.findMembership(organizationId, userId);
      if (!target) throw new AppError('NOT_FOUND');
      if (target.role === 'OWNER' && membership.role !== 'OWNER') {
        throw new AppError('FORBIDDEN');
      }
      if (target.role === 'OWNER' && (await deps.orgs.countOwners(organizationId)) <= 1) {
        throw new AppError('FORBIDDEN', 'Cannot remove the last owner');
      }
      await deps.orgs.removeMembership(organizationId, userId);
      await deps.audit.record({
        actorId,
        action: 'org.member.remove',
        resourceType: 'user',
        resourceId: userId,
      });
      return { removed: true as const };
    },

    leave: async (actorId: string, organizationId: string) => {
      const membership = await requireMember(organizationId, actorId);
      if (membership.role === 'OWNER' && (await deps.orgs.countOwners(organizationId)) <= 1) {
        throw new AppError('FORBIDDEN', 'Cannot leave as the last owner');
      }
      await deps.orgs.removeMembership(organizationId, actorId);
      return { left: true as const };
    },

    acceptInvite: async (body: AcceptInviteCommand) => {
      const invite = await deps.orgs.findInviteByTokenHash(hashRefresh(body.token));
      if (!invite || invite.acceptedAt || invite.expiresAt < now()) {
        throw new AppError('UNAUTHENTICATED', 'Invalid or expired token');
      }
      let user = await deps.users.findByEmail(invite.email);
      if (user && (user.status === 'SUSPENDED' || user.status === 'DELETED')) {
        throw new AppError('CONFLICT', 'Account cannot join');
      }
      if (!user) {
        if (!body.password) throw new AppError('VALIDATION_FAILED', 'Password is required');
        user = await deps.users.create({
          email: invite.email,
          displayName: body.displayName ?? displayNameFromEmail(invite.email),
          role: 'USER',
          status: 'ACTIVE',
          passwordHash: await hashPassword(body.password),
        });
      } else if (user.status === 'INVITED') {
        if (!body.password) throw new AppError('VALIDATION_FAILED', 'Password is required');
        user.passwordHash = await hashPassword(body.password);
        user.status = 'ACTIVE';
        if (body.displayName) user.displayName = body.displayName;
        await deps.users.save(user);
      }
      const already = await deps.orgs.findMembership(invite.organizationId, user.id);
      if (!already) {
        await deps.orgs.addMembership({
          organizationId: invite.organizationId,
          userId: user.id,
          role: invite.role,
        });
      }
      await deps.orgs.markInviteAccepted(invite.id, now());
      return { accepted: true as const };
    },
  };
};

export type OrganizationService = ReturnType<typeof createOrganizationService>;
