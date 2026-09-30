import type {
  AppointmentDto,
  CreateAppointmentCommand,
  PaginatedAppointment,
} from '@ysk/contracts';
import type { HttpClient } from '../http';

const toQuery = (query?: { cursor?: string; limit?: number }): string => {
  const params = new URLSearchParams();
  if (query?.cursor) params.set('cursor', query.cursor);
  if (query?.limit) params.set('limit', String(query.limit));
  const encoded = params.toString();
  return encoded.length > 0 ? `?${encoded}` : '';
};

export const appointmentResource = (http: HttpClient) => ({
  list: (query?: { cursor?: string; limit?: number }) =>
    http.request<PaginatedAppointment>(`/v1/appointment${toQuery(query)}`),
  create: (body: CreateAppointmentCommand) =>
    http.request<AppointmentDto>('/v1/appointment', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  cancel: (id: string) =>
    http.request<AppointmentDto>(`/v1/appointment/${id}/cancel`, {
      method: 'POST',
      body: '{}',
    }),
  complete: (id: string) =>
    http.request<AppointmentDto>(`/v1/appointment/${id}/complete`, {
      method: 'POST',
      body: '{}',
    }),
});
