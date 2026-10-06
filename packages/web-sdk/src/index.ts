import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateApiKeyCommand,
  CreateUserCommand,
  ForgotPasswordCommand,
  LoginPasswordCommand,
  RegisterCommand,
  RequestAdminOtpCommand,
  ResetPasswordCommand,
  VerifyAdminOtpCommand,
} from '@ysk-kit/contracts';
import { RealtimeEvent } from '@ysk-kit/contracts';
import type { YskClient } from '@ysk-kit/sdk';
import { useEffect } from 'react';

export const usersQueryKey = ['users'] as const;
export const meQueryKey = ['me'] as const;
export const notificationsQueryKey = ['notifications'] as const;
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

export { billingQueryKey, createBillingHooks } from './billing-hooks.js';
export { createLlmHooks } from './llm-hooks.js';
export {
  createOrganizationHooks,
  organizationQueryKey,
  organizationsQueryKey,
} from './organizations-hooks.js';
