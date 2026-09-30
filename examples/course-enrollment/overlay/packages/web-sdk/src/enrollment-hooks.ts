import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateEnrollmentCommand } from '@ysk/contracts';
import type { YskClient } from '@ysk/sdk';

export const enrollmentQueryKey = ['enrollment'] as const;

export function createEnrollmentHooks(client: YskClient) {
  return {
    useList: (query?: { cursor?: string; limit?: number }) =>
      useQuery({
        queryKey: [...enrollmentQueryKey, query],
        queryFn: () => client.enrollment.list(query),
      }),
    useCreate: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (body: CreateEnrollmentCommand) => client.enrollment.create(body),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: enrollmentQueryKey });
        },
      });
    },
  };
}
