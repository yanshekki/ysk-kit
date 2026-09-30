import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateSkuCommand } from '@ysk-kit/contracts';
import type { YskClient } from '@ysk-kit/sdk';

export const skuQueryKey = ['sku'] as const;

export function createSkuHooks(client: YskClient) {
  return {
    useList: (query?: { cursor?: string; limit?: number }) =>
      useQuery({
        queryKey: [...skuQueryKey, query],
        queryFn: () => client.sku.list(query),
      }),
    useCreate: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (body: CreateSkuCommand) => client.sku.create(body),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: skuQueryKey });
        },
      });
    },
  };
}
