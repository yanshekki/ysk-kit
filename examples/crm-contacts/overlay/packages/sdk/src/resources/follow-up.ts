import type { CreateFollowUpCommand, FollowUpDto, PaginatedFollowUp } from '@ysk-kit/contracts';
import type { HttpClient } from '../http';

const toQuery = (query?: { cursor?: string; limit?: number }): string => {
  const params = new URLSearchParams();
  if (query?.cursor) params.set('cursor', query.cursor);
  if (query?.limit) params.set('limit', String(query.limit));
  const encoded = params.toString();
  return encoded.length > 0 ? `?${encoded}` : '';
};

export const followUpResource = (http: HttpClient) => ({
  list: (query?: { cursor?: string; limit?: number }) =>
    http.request<PaginatedFollowUp>(`/v1/follow-up${toQuery(query)}`),
  create: (body: CreateFollowUpCommand) =>
    http.request<FollowUpDto>('/v1/follow-up', { method: 'POST', body: JSON.stringify(body) }),
});
