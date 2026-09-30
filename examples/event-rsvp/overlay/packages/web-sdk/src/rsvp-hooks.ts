import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateRsvpCommand } from '@ysk/contracts';
import type { YskClient } from '@ysk/sdk';

export const rsvpQueryKey = ['rsvp'] as const;

export function createRsvpHooks(client: YskClient) {
  return {
    useList: (query?: { cursor?: string; limit?: number }) =>
      useQuery({
        queryKey: [...rsvpQueryKey, query],
        queryFn: () => client.rsvp.list(query),
      }),
    useCreate: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (body: CreateRsvpCommand) => client.rsvp.create(body),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: rsvpQueryKey });
        },
      });
    },
  };
}
