import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateApplicationCommand } from '@ysk-kit/contracts';
import type { YskClient } from '@ysk-kit/sdk';

export const applicationQueryKey = ['application'] as const;

export function createApplicationHooks(client: YskClient) {
  return {
    useList: (query?: { cursor?: string; limit?: number }) =>
      useQuery({
        queryKey: [...applicationQueryKey, query],
        queryFn: () => client.application.list(query),
      }),
    useCreate: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (body: CreateApplicationCommand) => client.application.create(body),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: applicationQueryKey });
        },
      });
    },
  };
}
