import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateQuoteCommand } from '@ysk-kit/contracts';
import type { YskClient } from '@ysk-kit/sdk';

export const quoteQueryKey = ['quote'] as const;

export function createQuoteHooks(client: YskClient) {
  return {
    useList: (query?: { cursor?: string; limit?: number }) =>
      useQuery({
        queryKey: [...quoteQueryKey, query],
        queryFn: () => client.quote.list(query),
      }),
    useCreate: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (body: CreateQuoteCommand) => client.quote.create(body),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: quoteQueryKey });
        },
      });
    },
    useSend: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (id: string) => client.quote.send(id),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: quoteQueryKey });
        },
      });
    },
    useAccept: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (id: string) => client.quote.accept(id),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: quoteQueryKey });
        },
      });
    },
  };
}
