import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateFollowUpCommand } from '@ysk/contracts';
import type { YskClient } from '@ysk/sdk';

export const followUpQueryKey = ['follow-up'] as const;

export function createFollowUpHooks(client: YskClient) {
  return {
    useList: (query?: { cursor?: string; limit?: number }) =>
      useQuery({
        queryKey: [...followUpQueryKey, query],
        queryFn: () => client.followUp.list(query),
      }),
    useCreate: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (body: CreateFollowUpCommand) => client.followUp.create(body),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: followUpQueryKey });
        },
      });
    },
  };
}
