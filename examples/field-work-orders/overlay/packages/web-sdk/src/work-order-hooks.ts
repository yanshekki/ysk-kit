import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateWorkOrderCommand } from '@ysk-kit/contracts';
import type { YskClient } from '@ysk-kit/sdk';

export const workOrderQueryKey = ['work-order'] as const;

export function createWorkOrderHooks(client: YskClient) {
  return {
    useList: (query?: { cursor?: string; limit?: number }) =>
      useQuery({
        queryKey: [...workOrderQueryKey, query],
        queryFn: () => client.workOrder.list(query),
      }),
    useCreate: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (body: CreateWorkOrderCommand) => client.workOrder.create(body),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: workOrderQueryKey });
        },
      });
    },
    useAssign: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (id: string) => client.workOrder.assign(id),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: workOrderQueryKey });
        },
      });
    },
    useComplete: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (id: string) => client.workOrder.complete(id),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: workOrderQueryKey });
        },
      });
    },
  };
}
