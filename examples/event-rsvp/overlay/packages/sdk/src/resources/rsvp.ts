import type { CreateRsvpCommand, PaginatedRsvp, RsvpDto } from '@ysk/contracts';
import type { HttpClient } from '../http';

const toQuery = (query?: { cursor?: string; limit?: number }): string => {
  const params = new URLSearchParams();
  if (query?.cursor) params.set('cursor', query.cursor);
  if (query?.limit) params.set('limit', String(query.limit));
  const encoded = params.toString();
  return encoded.length > 0 ? `?${encoded}` : '';
};

export const rsvpResource = (http: HttpClient) => ({
  list: (query?: { cursor?: string; limit?: number }) =>
    http.request<PaginatedRsvp>(`/v1/rsvp${toQuery(query)}`),
  create: (body: CreateRsvpCommand) =>
    http.request<RsvpDto>('/v1/rsvp', { method: 'POST', body: JSON.stringify(body) }),
});
