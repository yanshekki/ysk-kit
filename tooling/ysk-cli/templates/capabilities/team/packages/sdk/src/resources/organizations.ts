import type {
  AcceptInviteCommand,
  CreateOrganizationCommand,
  InviteMemberCommand,
  MembershipDto,
  OrganizationDto,
  OrgInviteDto,
  UpdateOrganizationCommand,
} from '@ysk-kit/contracts';
import type { HttpClient } from '../http.js';

export const organizationsResource = (http: HttpClient) => ({
  create: (body: CreateOrganizationCommand) =>
    http.request<OrganizationDto>('/v1/organizations', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  list: () => http.request<OrganizationDto[]>('/v1/organizations'),
  get: (organizationId: string) =>
    http.request<OrganizationDto>(`/v1/organizations/${organizationId}`),
  update: (organizationId: string, body: UpdateOrganizationCommand) =>
    http.request<OrganizationDto>(`/v1/organizations/${organizationId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  members: (organizationId: string) =>
    http.request<MembershipDto[]>(`/v1/organizations/${organizationId}/members`),
  invite: (organizationId: string, body: InviteMemberCommand) =>
    http.request<OrgInviteDto>(`/v1/organizations/${organizationId}/invites`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  invites: (organizationId: string) =>
    http.request<OrgInviteDto[]>(`/v1/organizations/${organizationId}/invites`),
  revokeInvite: (organizationId: string, id: string) =>
    http.request<{ removed: true }>(`/v1/organizations/${organizationId}/invites/${id}`, {
      method: 'DELETE',
    }),
  removeMember: (organizationId: string, userId: string) =>
    http.request<{ removed: true }>(`/v1/organizations/${organizationId}/members/${userId}`, {
      method: 'DELETE',
    }),
  leave: (organizationId: string) =>
    http.request<{ left: true }>(`/v1/organizations/${organizationId}/leave`, {
      method: 'POST',
      body: '{}',
    }),
  acceptInvite: (body: AcceptInviteCommand) =>
    http.request<{ accepted: true }>('/v1/organizations/invites/accept', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
});
