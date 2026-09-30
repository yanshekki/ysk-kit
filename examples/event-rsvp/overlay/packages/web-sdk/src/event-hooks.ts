import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateEventCommand } from '@ysk/contracts';
import type { YskClient } from '@ysk/sdk';

export const eventQueryKey = ['event'] as const;

export function createEventHooks(client: YskClient) {
  return {
    useList: (query?: { cursor?: string; limit?: number }) =>
      useQuery({
        queryKey: [...eventQueryKey, query],
        queryFn: () => client.event.list(query),
      }),
    useCreate: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (body: CreateEventCommand) => client.event.create(body),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: eventQueryKey });
        },
      });
    },
  };
}
