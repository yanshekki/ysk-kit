import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  AcceptedInviteDtoSchema,
  AcceptInviteCommandSchema,
  CreateOrganizationCommandSchema,
  InviteMemberCommandSchema,
  MembershipDtoSchema,
  OrganizationDtoSchema,
  OrgInviteDtoSchema,
  UpdateOrganizationCommandSchema,
} from '../dto/organization';
import { ErrSchema, OkSchema } from '../errors/envelope';

const c = initContract();
const orgIdParams = z.object({ organizationId: z.string().uuid() });
const memberParams = z.object({
  organizationId: z.string().uuid(),
  userId: z.string().uuid(),
});
const inviteParams = z.object({
  organizationId: z.string().uuid(),
  id: z.string().uuid(),
});

export const organizationsContract = c.router({
  create: {
    method: 'POST',
    path: '/v1/organizations',
    body: CreateOrganizationCommandSchema,
    responses: { 201: OkSchema(OrganizationDtoSchema), 401: ErrSchema, 422: ErrSchema },
    summary: 'Create an organization',
  },
  list: {
    method: 'GET',
    path: '/v1/organizations',
    responses: { 200: OkSchema(z.array(OrganizationDtoSchema)), 401: ErrSchema },
    summary: 'List my organizations',
  },
  acceptInvite: {
    method: 'POST',
    path: '/v1/organizations/invites/accept',
    body: AcceptInviteCommandSchema,
    responses: {
      200: OkSchema(AcceptedInviteDtoSchema),
      401: ErrSchema,
      409: ErrSchema,
      422: ErrSchema,
    },
    summary: 'Accept an organization invite',
  },
  get: {
    method: 'GET',
    path: '/v1/organizations/:organizationId',
    pathParams: orgIdParams,
    responses: {
      200: OkSchema(OrganizationDtoSchema),
      401: ErrSchema,
      403: ErrSchema,
      404: ErrSchema,
    },
    summary: 'Get an organization',
  },
  update: {
    method: 'PATCH',
    path: '/v1/organizations/:organizationId',
    pathParams: orgIdParams,
    body: UpdateOrganizationCommandSchema,
    responses: {
      200: OkSchema(OrganizationDtoSchema),
      401: ErrSchema,
      403: ErrSchema,
      404: ErrSchema,
      422: ErrSchema,
    },
    summary: 'Rename an organization',
  },
  members: {
    method: 'GET',
    path: '/v1/organizations/:organizationId/members',
    pathParams: orgIdParams,
    responses: {
      200: OkSchema(z.array(MembershipDtoSchema)),
      401: ErrSchema,
      403: ErrSchema,
      404: ErrSchema,
    },
    summary: 'List members',
  },
  invite: {
    method: 'POST',
    path: '/v1/organizations/:organizationId/invites',
    pathParams: orgIdParams,
    body: InviteMemberCommandSchema,
    responses: {
      200: OkSchema(OrgInviteDtoSchema),
      401: ErrSchema,
      403: ErrSchema,
      404: ErrSchema,
      409: ErrSchema,
      422: ErrSchema,
    },
    summary: 'Invite a member by email',
  },
  invites: {
    method: 'GET',
    path: '/v1/organizations/:organizationId/invites',
    pathParams: orgIdParams,
    responses: {
      200: OkSchema(z.array(OrgInviteDtoSchema)),
      401: ErrSchema,
      403: ErrSchema,
      404: ErrSchema,
    },
    summary: 'List pending invites',
  },
  revokeInvite: {
    method: 'DELETE',
    path: '/v1/organizations/:organizationId/invites/:id',
    pathParams: inviteParams,
    responses: {
      200: OkSchema(z.object({ removed: z.literal(true) })),
      401: ErrSchema,
      403: ErrSchema,
      404: ErrSchema,
    },
    summary: 'Revoke a pending invite',
  },
  removeMember: {
    method: 'DELETE',
    path: '/v1/organizations/:organizationId/members/:userId',
    pathParams: memberParams,
    responses: {
      200: OkSchema(z.object({ removed: z.literal(true) })),
      401: ErrSchema,
      403: ErrSchema,
      404: ErrSchema,
    },
    summary: 'Remove a member',
  },
  leave: {
    method: 'POST',
    path: '/v1/organizations/:organizationId/leave',
    pathParams: orgIdParams,
    body: z.object({}).optional(),
    responses: {
      200: OkSchema(z.object({ left: z.literal(true) })),
      401: ErrSchema,
      403: ErrSchema,
      404: ErrSchema,
    },
    summary: 'Leave an organization',
  },
});
