import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateTicketCommand, UpdateTicketStatusCommand } from '@ysk/contracts';
import type { YskClient } from '@ysk/sdk';

export const ticketQueryKey = ['ticket'] as const;

export function createTicketHooks(client: YskClient) {
  return {
    useList: (organizationId: string | undefined) =>
      useQuery({
        queryKey: [...ticketQueryKey, organizationId],
        queryFn: () => client.ticket.list({ organizationId: organizationId as string }),
        enabled: Boolean(organizationId),
      }),
    useCreate: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (body: CreateTicketCommand) => client.ticket.create(body),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: ticketQueryKey });
        },
      });
    },
    useStatus: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (input: { id: string } & UpdateTicketStatusCommand) =>
          client.ticket.status(input.id, { status: input.status }),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: ticketQueryKey });
        },
      });
    },
  };
}
