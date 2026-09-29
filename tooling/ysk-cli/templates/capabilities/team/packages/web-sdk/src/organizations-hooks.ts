import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AcceptInviteCommand,
  CreateOrganizationCommand,
  InviteMemberCommand,
} from '@ysk/contracts';
import type { YskClient } from '@ysk/sdk';

export const organizationsQueryKey = ['organizations'] as const;
export const organizationQueryKey = (id: string) => ['organization', id] as const;

export function createOrganizationHooks(client: YskClient) {
  return {
    useOrganizations: () =>
      useQuery({
        queryKey: organizationsQueryKey,
        queryFn: () => client.organizations.list(),
      }),
    useOrganization: (id: string) =>
      useQuery({
        queryKey: organizationQueryKey(id),
        queryFn: () => client.organizations.get(id),
        enabled: id.length > 0,
      }),
    useOrganizationMembers: (id: string) =>
      useQuery({
        queryKey: [...organizationQueryKey(id), 'members'],
        queryFn: () => client.organizations.members(id),
        enabled: id.length > 0,
      }),
    useOrganizationInvites: (id: string, enabled = true) =>
      useQuery({
        queryKey: [...organizationQueryKey(id), 'invites'],
        queryFn: () => client.organizations.invites(id),
        enabled: id.length > 0 && enabled,
        retry: false,
      }),
    useCreateOrganization: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (body: CreateOrganizationCommand) => client.organizations.create(body),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: organizationsQueryKey });
        },
      });
    },
    useInviteMember: (organizationId: string) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (body: InviteMemberCommand) =>
          client.organizations.invite(organizationId, body),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: organizationQueryKey(organizationId) });
        },
      });
    },
    useRemoveMember: (organizationId: string) => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (userId: string) => client.organizations.removeMember(organizationId, userId),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: organizationQueryKey(organizationId) });
        },
      });
    },
    useLeaveOrganization: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (organizationId: string) => client.organizations.leave(organizationId),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: organizationsQueryKey });
        },
      });
    },
    useAcceptInvite: () =>
      useMutation({
        mutationFn: (body: AcceptInviteCommand) => client.organizations.acceptInvite(body),
      }),
  };
}
