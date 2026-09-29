import { type HttpHandler, mountContract } from '@ysk/api-express';
import type { AccessClaims } from '@ysk/auth';
import {
  type AcceptInviteCommand,
  appContract,
  type CreateOrganizationCommand,
  type InviteMemberCommand,
  type UpdateOrganizationCommand,
} from '@ysk/contracts';
import { AppError } from '@ysk/domain-kernel';
import type { Express } from 'express';
import type { OrganizationService } from '../application/organization-service';

const orgId = (params: unknown): string => (params as { organizationId: string }).organizationId;

const actor = (auth: AccessClaims | undefined): AccessClaims => {
  if (!auth) throw new AppError('UNAUTHENTICATED');
  return auth;
};

export const organizationHandlers = (
  service: OrganizationService,
): Record<string, HttpHandler> => ({
  create: {
    auth: 'required',
    handle: async ({ body, auth }) => ({
      status: 201,
      body: {
        ok: true,
        data: await service.create(actor(auth).sub, body as CreateOrganizationCommand),
      },
    }),
  },
  list: {
    auth: 'required',
    handle: async ({ auth }) => ({
      status: 200,
      body: { ok: true, data: await service.listMine(actor(auth).sub) },
    }),
  },
  acceptInvite: {
    handle: async ({ body }) => ({
      status: 200,
      body: { ok: true, data: await service.acceptInvite(body as AcceptInviteCommand) },
    }),
  },
  get: {
    auth: 'required',
    handle: async ({ params, auth }) => ({
      status: 200,
      body: { ok: true, data: await service.get(actor(auth).sub, orgId(params)) },
    }),
  },
  update: {
    auth: 'required',
    handle: async ({ params, body, auth }) => ({
      status: 200,
      body: {
        ok: true,
        data: await service.update(
          actor(auth).sub,
          orgId(params),
          body as UpdateOrganizationCommand,
        ),
      },
    }),
  },
  members: {
    auth: 'required',
    handle: async ({ params, auth }) => ({
      status: 200,
      body: { ok: true, data: await service.members(actor(auth).sub, orgId(params)) },
    }),
  },
  invite: {
    auth: 'required',
    handle: async ({ params, body, auth }) => ({
      status: 200,
      body: {
        ok: true,
        data: await service.invite(actor(auth).sub, orgId(params), body as InviteMemberCommand),
      },
    }),
  },
  invites: {
    auth: 'required',
    handle: async ({ params, auth }) => ({
      status: 200,
      body: { ok: true, data: await service.invites(actor(auth).sub, orgId(params)) },
    }),
  },
  revokeInvite: {
    auth: 'required',
    handle: async ({ params, auth }) => ({
      status: 200,
      body: {
        ok: true,
        data: await service.revokeInvite(
          actor(auth).sub,
          orgId(params),
          (params as { id: string }).id,
        ),
      },
    }),
  },
  removeMember: {
    auth: 'required',
    handle: async ({ params, auth }) => {
      const p = params as { organizationId: string; userId: string };
      return {
        status: 200,
        body: {
          ok: true,
          data: await service.removeMember(actor(auth).sub, p.organizationId, p.userId),
        },
      };
    },
  },
  leave: {
    auth: 'required',
    handle: async ({ params, auth }) => ({
      status: 200,
      body: { ok: true, data: await service.leave(actor(auth).sub, orgId(params)) },
    }),
  },
});

export const registerOrganizationRoutes = (app: Express, service: OrganizationService): void => {
  mountContract(app, appContract.organizations, organizationHandlers(service));
};
