import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateCourseCommand } from '@ysk-kit/contracts';
import type { YskClient } from '@ysk-kit/sdk';

export const courseQueryKey = ['course'] as const;

export function createCourseHooks(client: YskClient) {
  return {
    useList: (query?: { cursor?: string; limit?: number }) =>
      useQuery({
        queryKey: [...courseQueryKey, query],
        queryFn: () => client.course.list(query),
      }),
    useCreate: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (body: CreateCourseCommand) => client.course.create(body),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: courseQueryKey });
        },
      });
    },
  };
}
