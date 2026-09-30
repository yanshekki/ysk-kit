import type { CreateEventCommand, EventDto, PaginatedEvent } from '@ysk/contracts';
import type { HttpClient } from '../http';

const toQuery = (query?: { cursor?: string; limit?: number }): string => {
  const params = new URLSearchParams();
  if (query?.cursor) params.set('cursor', query.cursor);
  if (query?.limit) params.set('limit', String(query.limit));
  const encoded = params.toString();
  return encoded.length > 0 ? `?${encoded}` : '';
};

export const eventResource = (http: HttpClient) => ({
  list: (query?: { cursor?: string; limit?: number }) =>
    http.request<PaginatedEvent>(`/v1/event${toQuery(query)}`),
  create: (body: CreateEventCommand) =>
    http.request<EventDto>('/v1/event', { method: 'POST', body: JSON.stringify(body) }),
});
