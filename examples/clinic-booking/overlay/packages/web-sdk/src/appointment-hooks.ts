import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateAppointmentCommand } from '@ysk/contracts';
import type { YskClient } from '@ysk/sdk';

export const appointmentQueryKey = ['appointment'] as const;

export function createAppointmentHooks(client: YskClient) {
  return {
    useList: (query?: { cursor?: string; limit?: number }) =>
      useQuery({
        queryKey: [...appointmentQueryKey, query],
        queryFn: () => client.appointment.list(query),
      }),
    useCreate: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (body: CreateAppointmentCommand) => client.appointment.create(body),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: appointmentQueryKey });
        },
      });
    },
    useCancel: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (id: string) => client.appointment.cancel(id),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: appointmentQueryKey });
        },
      });
    },
    useComplete: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (id: string) => client.appointment.complete(id),
        onSuccess: () => {
          void qc.invalidateQueries({ queryKey: appointmentQueryKey });
        },
      });
    },
  };
}
