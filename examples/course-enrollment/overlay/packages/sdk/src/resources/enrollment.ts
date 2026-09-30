import type { CreateEnrollmentCommand, EnrollmentDto, PaginatedEnrollment } from '@ysk/contracts';
import type { HttpClient } from '../http';

const toQuery = (query?: { cursor?: string; limit?: number }): string => {
  const params = new URLSearchParams();
  if (query?.cursor) params.set('cursor', query.cursor);
  if (query?.limit) params.set('limit', String(query.limit));
  const encoded = params.toString();
  return encoded.length > 0 ? `?${encoded}` : '';
};

export const enrollmentResource = (http: HttpClient) => ({
  list: (query?: { cursor?: string; limit?: number }) =>
    http.request<PaginatedEnrollment>(`/v1/enrollment${toQuery(query)}`),
  create: (body: CreateEnrollmentCommand) =>
    http.request<EnrollmentDto>('/v1/enrollment', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
});
