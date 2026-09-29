import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AcceptInviteCommand,
  CancelCommand,
  CheckoutCommand,
  CreateApiKeyCommand,
  CreateOrganizationCommand,
  CreateUserCommand,
  ForgotPasswordCommand,
  InviteMemberCommand,
  LlmCompleteCommand,
  LoginPasswordCommand,
  PortalCommand,
  RegisterCommand,
  RequestAdminOtpCommand,
  ResetPasswordCommand,
  VerifyAdminOtpCommand,
} from '@ysk/contracts';
import { RealtimeEvent } from '@ysk/contracts';
import type { YskClient } from '@ysk/sdk';
import { useEffect } from 'react';

export const usersQueryKey = ['users'] as const;
export const meQueryKey = ['me'] as const;
export const notificationsQueryKey = ['notifications'] as const;
export const organizationsQueryKey = ['organizations'] as const;
export const organizationQueryKey = (id: string) => ['organization', id] as const;
export const billingQueryKey = (organizationId: string) => ['billing', organizationId] as const;
export const auditQueryKey = ['audit'] as const;
export const apiKeysQueryKey = ['api-keys'] as const;

export function createUserHooks(client: YskClient) {
  return {
    useUsers: (query?: { cursor?: string; limit?: number }) =>
      useQuery({
        queryKey: [...usersQueryKey, query],
        queryFn: () => client.users.list(query),
      }),
    useCreateUser: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (body: CreateUserCommand) => client.users.create(body),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: usersQueryKey });
        },
      });
    },
    useSuspendUser: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (id: string) => client.users.suspend(id),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: usersQueryKey });
        },
      });
    },
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
    useMe: () =>
      useQuery({
        queryKey: meQueryKey,
        queryFn: () => client.auth.me(),
        retry: false,
      }),
    useRequestAdminOtp: () =>
      useMutation({
        mutationFn: (body: RequestAdminOtpCommand) => client.auth.requestAdminOtp(body),
      }),
    useVerifyAdminOtp: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (body: VerifyAdminOtpCommand) => client.auth.verifyAdminOtp(body),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: meQueryKey });
        },
      });
    },
    useLogin: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (body: LoginPasswordCommand) => client.auth.login(body),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: meQueryKey });
        },
      });
    },
    useRegister: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (body: RegisterCommand) => client.auth.register(body),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: meQueryKey });
        },
      });
    },
    useLogout: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: () => client.auth.logout(),
        onSuccess: () => {
          qc.removeQueries({ queryKey: meQueryKey });
          qc.removeQueries({ queryKey: usersQueryKey });
          qc.removeQueries({ queryKey: notificationsQueryKey });
          qc.removeQueries({ queryKey: organizationsQueryKey });
        },
      });
    },
    useForgotPassword: () =>
      useMutation({
        mutationFn: (body: ForgotPasswordCommand) => client.auth.forgot(body),
      }),
    useResetPassword: () =>
      useMutation({
        mutationFn: (body: ResetPasswordCommand) => client.auth.reset(body),
      }),
    useNotifications: () =>
      useQuery({
        queryKey: notificationsQueryKey,
        queryFn: () => client.notifications.list(),
      }),
    useMarkNotificationRead: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (id: string) => client.notifications.markRead(id),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: notificationsQueryKey });
        },
      });
    },
    useNotificationsLive: () => {
      const qc = useQueryClient();
      useEffect(() => {
        let close: (() => void) | undefined;
        void client.connectRealtime().then((socket) => {
          socket.on(RealtimeEvent.NOTIFICATION_CREATED, () => {
            void qc.invalidateQueries({ queryKey: notificationsQueryKey });
          });
          close = socket.close;
        });
        return () => close?.();
      }, [qc]);
    },
    useLlmComplete: () =>
      useMutation({
        mutationFn: (body: LlmCompleteCommand) => client.llm.complete(body),
      }),
    useBillingPlans: () =>
      useQuery({
        queryKey: ['billing-plans'],
        queryFn: () => client.billing.plans(),
      }),
    useSubscription: (organizationId: string, enabled = true) =>
      useQuery({
        queryKey: [...billingQueryKey(organizationId), 'subscription'],
        queryFn: () => client.billing.subscription(organizationId),
        enabled: organizationId.length > 0 && enabled,
        retry: false,
      }),
    useInvoices: (organizationId: string, enabled = true) =>
      useQuery({
        queryKey: [...billingQueryKey(organizationId), 'invoices'],
        queryFn: () => client.billing.invoices(organizationId),
        enabled: organizationId.length > 0 && enabled,
        retry: false,
      }),
    useCheckout: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (body: CheckoutCommand) => client.billing.checkout(body),
        onSuccess: (_data, body) => {
          void qc.invalidateQueries({ queryKey: billingQueryKey(body.organizationId) });
        },
      });
    },
    useBillingPortal: () =>
      useMutation({
        mutationFn: (body: PortalCommand) => client.billing.portal(body),
      }),
    useCancelSubscription: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (body: CancelCommand) => client.billing.cancel(body),
        onSuccess: (_data, body) => {
          void qc.invalidateQueries({ queryKey: billingQueryKey(body.organizationId) });
        },
      });
    },
    useInvoicePdf: () =>
      useMutation({
        mutationFn: (args: { id: string; organizationId: string }) =>
          client.billing.invoicePdfUrl(args.id, args.organizationId),
      }),
    useAuditLogs: (query?: { cursor?: string; limit?: number }, enabled = true) =>
      useQuery({
        queryKey: [...auditQueryKey, query],
        queryFn: () => client.audit.list(query),
        enabled,
        retry: false,
      }),
    useApiKeys: () =>
      useQuery({
        queryKey: apiKeysQueryKey,
        queryFn: () => client.apiKeys.list(),
      }),
    useCreateApiKey: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (body: CreateApiKeyCommand) => client.apiKeys.create(body),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: apiKeysQueryKey });
        },
      });
    },
    useRevokeApiKey: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (id: string) => client.apiKeys.revoke(id),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: apiKeysQueryKey });
        },
      });
    },
  };
}

export type UserHooks = ReturnType<typeof createUserHooks>;
