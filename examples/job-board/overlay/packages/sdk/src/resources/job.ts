import type { CreateJobCommand, JobDto, PaginatedJob } from '@ysk-kit/contracts';
import type { HttpClient } from '../http';

const toQuery = (query?: { cursor?: string; limit?: number }): string => {
  const params = new URLSearchParams();
  if (query?.cursor) params.set('cursor', query.cursor);
  if (query?.limit) params.set('limit', String(query.limit));
  const encoded = params.toString();
  return encoded.length > 0 ? `?${encoded}` : '';
};

export const jobResource = (http: HttpClient) => ({
  list: (query?: { cursor?: string; limit?: number }) =>
    http.request<PaginatedJob>(`/v1/job${toQuery(query)}`),
  create: (body: CreateJobCommand) =>
    http.request<JobDto>('/v1/job', { method: 'POST', body: JSON.stringify(body) }),
  publish: (id: string) =>
    http.request<JobDto>(`/v1/job/${id}/publish`, { method: 'POST', body: '{}' }),
});
