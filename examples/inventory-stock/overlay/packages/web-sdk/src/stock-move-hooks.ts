import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateStockMoveCommand } from '@ysk-kit/contracts';
import type { YskClient } from '@ysk-kit/sdk';
import { skuQueryKey } from './sku-hooks';

export const stockMoveQueryKey = ['stock-move'] as const;

export function createStockMoveHooks(client: YskClient) {
  return {
    useList: (query?: { cursor?: string; limit?: number }) =>
      useQuery({
        queryKey: [...stockMoveQueryKey, query],
        queryFn: () => client.stockMove.list(query),
      }),
    useCreate: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (body: CreateStockMoveCommand) => client.stockMove.create(body),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: stockMoveQueryKey });
          void qc.invalidateQueries({ queryKey: skuQueryKey });
        },
      });
    },
  };
}
