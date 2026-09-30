import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateContactCommand, UpdateContactStatusCommand } from '@ysk/contracts';
import type { YskClient } from '@ysk/sdk';

export const contactQueryKey = ['contact'] as const;

export function createContactHooks(client: YskClient) {
  return {
    useList: (query?: { cursor?: string; limit?: number }) =>
      useQuery({
        queryKey: [...contactQueryKey, query],
        queryFn: () => client.contact.list(query),
      }),
    useCreate: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (body: CreateContactCommand) => client.contact.create(body),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: contactQueryKey });
        },
      });
    },
    useStatus: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (input: { id: string } & UpdateContactStatusCommand) =>
          client.contact.status(input.id, { status: input.status }),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: contactQueryKey });
        },
      });
    },
  };
}
