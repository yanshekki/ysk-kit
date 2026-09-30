import type {
  ApplicationDto,
  CreateApplicationCommand,
  PaginatedApplication,
} from '@ysk-kit/contracts';
import type { HttpClient } from '../http';

const toQuery = (query?: { cursor?: string; limit?: number }): string => {
  const params = new URLSearchParams();
  if (query?.cursor) params.set('cursor', query.cursor);
  if (query?.limit) params.set('limit', String(query.limit));
  const encoded = params.toString();
  return encoded.length > 0 ? `?${encoded}` : '';
};

export const applicationResource = (http: HttpClient) => ({
  list: (query?: { cursor?: string; limit?: number }) =>
    http.request<PaginatedApplication>(`/v1/application${toQuery(query)}`),
  create: (body: CreateApplicationCommand) =>
    http.request<ApplicationDto>('/v1/application', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
});
