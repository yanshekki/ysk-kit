import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateMemberProfileCommand } from '@ysk/contracts';
import type { YskClient } from '@ysk/sdk';

export const memberProfileQueryKey = ['member-profile'] as const;

export function createMemberProfileHooks(client: YskClient) {
  return {
    useList: (query?: { cursor?: string; limit?: number }) =>
      useQuery({
        queryKey: [...memberProfileQueryKey, query],
        queryFn: () => client.memberProfile.list(query),
      }),
    useCreate: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (body: CreateMemberProfileCommand) => client.memberProfile.create(body),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: memberProfileQueryKey });
        },
      });
    },
  };
}
