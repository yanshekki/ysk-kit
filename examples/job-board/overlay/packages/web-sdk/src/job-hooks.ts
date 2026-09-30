import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateJobCommand } from '@ysk/contracts';
import type { YskClient } from '@ysk/sdk';

export const jobQueryKey = ['job'] as const;

export function createJobHooks(client: YskClient) {
  return {
    useList: (query?: { cursor?: string; limit?: number }) =>
      useQuery({
        queryKey: [...jobQueryKey, query],
        queryFn: () => client.job.list(query),
      }),
    useCreate: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (body: CreateJobCommand) => client.job.create(body),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: jobQueryKey });
        },
      });
    },
    usePublish: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (id: string) => client.job.publish(id),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: jobQueryKey });
        },
      });
    },
  };
}
